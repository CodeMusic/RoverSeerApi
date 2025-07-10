# ✅ Base Redmine image
FROM redmine:6

# ✅ Environment setup
ENV BUNDLE_FORCE_RUBY_PLATFORM=true \
    NOKOGIRI_USE_SYSTEM_LIBRARIES=true

# ✅ Install native dependencies for Ruby gems (nokogiri, mysql2, etc.)
RUN apt-get update && apt-get install -y \
  libxml2-dev \
  libxslt1-dev \
  pkg-config \
  build-essential \
  ruby-dev \
  libffi-dev \
  libssl-dev \
  zlib1g-dev \
  libyaml-dev \
  libreadline-dev \
  default-libmysqlclient-dev \
  git \
  curl \
  gnupg \
  gcc \
  make \
  g++ \
  patch \
  && rm -rf /var/lib/apt/lists/*

# ✅ Clean any conflicting gem remains
RUN rm -rf /usr/src/redmine/vendor/bundle/ruby/3.3.0/gems/nokogiri*

# ✅ Ensure nokogiri builds against system libraries
RUN bundle config build.nokogiri --use-system-libraries

# ✅ Install critical gems with correct native extensions
RUN gem install json -v 2.12.2 -- --with-cflags="-Wno-error=implicit-function-declaration"
RUN gem install simplecov-cobertura

# ✅ Rebuild mysql2 with proper MySQL client linkage
RUN gem uninstall -x -I mysql2 || true && \
    gem install mysql2 -v 0.5.6 -- --with-mysql-config=/usr/bin/mysql_config

# ✅ Optional: Custom entrypoint script
COPY ./redmine-init.sh /usr/local/bin/redmine-init.sh
RUN chmod +x /usr/local/bin/redmine-init.sh
#RUN chown -R redmine:redmine /usr/src/redmine/db

# Ensure db folder exists and is writable
RUN mkdir -p /usr/src/redmine/db && \
    chown -R redmine:redmine /usr/src/redmine/db && \
    chmod -R u+rw /usr/src/redmine/db

# ✅ Use custom entrypoint
ENTRYPOINT ["/usr/local/bin/redmine-init.sh"]

# (Optional) fallback CMD (let the script decide normally)
# CMD ["rails", "server", "-b", "0.0.0.0"]
