import builtins
import importlib
import logging
import os
import sys
import traceback
import pickle
import subprocess
import base64
import tempfile

from agent.settings import SANDBOX_TIMEOUT

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

def _run_user_code(
    code: str,
    allow_installs: bool,
    allowed_path: str,
    blacklist: list,
    available_functions: dict,
    log: bool = False,
) -> tuple[dict, str]:
    """
    Execute code under sandboxed conditions and return (locals, error_message).
    """

    # Helper: safe same-dir temp write + atomic rename
    def safe_write_same_dir(target_path: str, content: str) -> str:
        dirpath = os.path.dirname(target_path) or "."
        os.makedirs(dirpath, exist_ok=True)
        with tempfile.NamedTemporaryFile("w", delete=False, dir=dirpath) as tf:
            tf.write(content)
            tmp = tf.name
        os.rename(tmp, target_path)
        return target_path

    try:
        # Optional: restrict working dir / file access
        if allowed_path:
            allowed = os.path.join(os.path.abspath(allowed_path), "")
            try:
                os.chdir(allowed)
            except Exception as e:
                logger.warning("Could not change working directory to %s: %s", allowed, e)

            # Force temp files inside allowed dir
            os.environ["TMPDIR"] = allowed
            tempfile.tempdir = allowed

            # Restrict open()
            orig_open = builtins.open
            def secure_open(file, *args, **kwargs):
                path = file if isinstance(file, str) else getattr(file, "name", str(file))
                full_path = os.path.abspath(path or "")
                if not full_path.startswith(allowed):
                    raise PermissionError(f"Access to '{full_path}' is denied by sandbox.")
                return orig_open(file, *args, **kwargs)
            builtins.open = secure_open

            # Restrict remove
            orig_remove = os.remove
            def secure_remove(path, *args, **kwargs):
                full_path = os.path.abspath(path)
                if not full_path.startswith(allowed):
                    raise PermissionError(f"Removal of '{full_path}' is denied by sandbox.")
                return orig_remove(path, *args, **kwargs)
            os.remove = secure_remove

            # Restrict/allow rename
            orig_rename = os.rename
            def secure_rename(src, dst, *args, **kwargs):
                full_src = os.path.abspath(src)
                full_dst = os.path.abspath(dst)
                # allow atomic replace within same directory
                if os.path.dirname(full_src) == os.path.dirname(full_dst):
                    return orig_rename(src, dst, *args, **kwargs)
                # allow moves entirely inside the allowed tree
                if full_src.startswith(allowed) and full_dst.startswith(allowed):
                    return orig_rename(src, dst, *args, **kwargs)
                raise PermissionError("Rename operation outside allowed path is denied by sandbox.")
            os.rename = secure_rename

        # Apply blacklist (disable risky builtins or module attrs)
        if blacklist:
            for name in blacklist:
                if "." in name:
                    mod_name, attr_name = name.split(".", 1)
                    try:
                        mod_obj = importlib.import_module(mod_name)
                    except ImportError:
                        mod_obj = None
                    if mod_obj and hasattr(mod_obj, attr_name):
                        try:
                            setattr(mod_obj, attr_name, None)
                        except Exception:
                            pass
                else:
                    if name in builtins.__dict__:
                        builtins.__dict__[name] = None

        # On-demand package installs
        if allow_installs:
            orig_import = builtins.__import__
            def custom_import(name, globals=None, locals=None, fromlist=(), level=0):
                try:
                    return orig_import(name, globals, locals, fromlist, level)
                except ImportError as e:
                    pkg = name.split(".")[0]
                    logger.info("Sandbox: attempting to install missing package '%s'", pkg)
                    try:
                        subprocess.run(
                            [sys.executable, "-m", "pip", "install", pkg],
                            check=True,
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL,
                        )
                    except Exception as inst_err:
                        logger.error("Sandbox: failed to install package %s: %s", pkg, inst_err)
                        raise e
                    return orig_import(name, globals, locals, fromlist, level)
            builtins.__import__ = custom_import

        # Execution environment
        exec_globals = {"__builtins__": builtins.__dict__}
        exec_globals["safe_write_same_dir"] = safe_write_same_dir  # expose helper
        if available_functions:
            exec_globals.update(available_functions)

        exec_locals = {}
        error_msg = None
        try:
            exec(code, exec_globals, exec_locals)
        except SystemExit as e:
            code_val = e.code if isinstance(e.code, int) or e.code else 0
            if code_val != 0:
                error_msg = f"Sandboxed code called sys.exit({code_val})"
                if log:
                    logger.warning("Sandbox: code exited with non-zero status %s", code_val)
        except Exception as e:
            tb = traceback.format_exc()
            error_msg = f"Exception in sandboxed code:\n{tb}"
            if log:
                logger.error("Sandbox: code raised an exception: %s", e)

        exec_locals.pop("__builtins__", None)

        # Only return picklable locals
        safe_locals = {}
        for var, val in exec_locals.items():
            try:
                pickle.dumps(val)
                safe_locals[var] = val
            except Exception:
                safe_locals[var] = repr(val)

        if log:
            logger.info("Sandbox execution finished")

        return safe_locals, error_msg

    except Exception:
        if log:
            logger.error("Unhandled exception in sandbox worker: %s", traceback.format_exc())
        return None, "Sandbox worker error: internal exception"


def execute_sandboxed_code(
    code: str,
    timeout: int = SANDBOX_TIMEOUT,
    allow_installs: bool = False,
    requirements_path: str = None,
    allowed_path: str = None,
    blacklist: list = None,
    available_functions: dict = None,
    import_module: str = None,
    log: bool = False,
) -> tuple[dict, str]:
    # Optional pre-install from requirements file
    if requirements_path:
        if os.path.isfile(requirements_path):
            logger.info("Installing packages from requirements file: %s", requirements_path)
            try:
                subprocess.run(
                    [sys.executable, "-m", "pip", "install", "-r", requirements_path],
                    check=True,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            except Exception as e:
                logger.error("Failed to install requirements from %s: %s", requirements_path, e)
                return None, f"Failed to install requirements: {e}"
        else:
            logger.error("Requirements file %s not found.", requirements_path)
            return None, f"Requirements file not found: {requirements_path}"

    # Shortcut: if available_functions is a string, treat as module name
    if isinstance(available_functions, str) and not import_module:
        import_module = available_functions
        available_functions = None

    # Import module and expose callables if requested
    if import_module:
        try:
            module = importlib.import_module(import_module)
            if available_functions is None:
                available_functions = {}
            for name in dir(module):
                if not name.startswith("_"):
                    attr = getattr(module, name)
                    if callable(attr):
                        available_functions[name] = attr
        except ImportError as e:
            logger.error("Failed to import module %s: %s", import_module, e)
            return None, f"Failed to import module {import_module}: {e}"

    # Spawn subprocess
    params = {
        "code": code,
        "allow_installs": allow_installs,
        "allowed_path": allowed_path,
        "blacklist": blacklist or [],
        "available_functions": available_functions or {},
        "log": log,
    }

    env = os.environ.copy()
    env["SANDBOX_PARAMS"] = base64.b64encode(pickle.dumps(params)).decode()

    try:
        result = subprocess.run(
            [sys.executable, "-m", "agent.engine"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout,
            env=env,
        )
    except subprocess.TimeoutExpired:
        logger.error("Sandboxed code exceeded time limit of %d seconds; terminating.", timeout)
        return None, f"TimeoutError: Code execution exceeded {timeout} seconds."

    if result.returncode != 0:
        return None, result.stderr.decode().strip()

    try:
        local_vars, error_msg = pickle.loads(result.stdout)
    except Exception as e:
        return None, f"Failed to decode sandbox output: {e}"

    if error_msg is None:
        error_msg = ""

    return local_vars, error_msg


def _subprocess_entry() -> None:
    params_b64 = os.environ.get("SANDBOX_PARAMS")
    if not params_b64:
        sys.exit(1)
    params = pickle.loads(base64.b64decode(params_b64))
    locals_dict, error = _run_user_code(
        params["code"],
        params.get("allow_installs", False),
        params.get("allowed_path"),
        params.get("blacklist", []),
        params.get("available_functions", {}),
        params.get("log", False),
    )
    sys.stdout.buffer.write(pickle.dumps((locals_dict, error)))


if __name__ == "__main__":
    _subprocess_entry()
