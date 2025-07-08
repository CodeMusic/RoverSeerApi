#!/bin/bash
set -e

echo "🔐 Fixing gem dir permissions..."
chmod 1777 /usr/local/bundle/gems

echo "🔗 Linking mounted plugins and themes..."

# Ensure target directories exist
mkdir -p /usr/src/redmine/plugins
mkdir -p /usr/src/redmine/public/themes

# Symlink each plugin in ./my-plugins
if [ -d /usr/src/redmine/my-plugins ]; then
  for plugin in /usr/src/redmine/my-plugins/*; do
    [ -d "$plugin" ] && ln -sf "$plugin" /usr/src/redmine/plugins/$(basename "$plugin")
  done
fi

# Symlink each theme in ./my-themes
if [ -d /usr/src/redmine/public/my-themes ]; then
  for theme in /usr/src/redmine/public/my-themes/*/; do
    [ -d "$theme" ] && ln -sf "$theme" /usr/src/redmine/public/themes/$(basename "$theme")
  done
fi

# 🩹 Prevent gem permission crash
#chmod -R o-w /usr/local/bundle/extensions
#chmod +t /usr/local/bundle/extensions

# ✅ Safe ownership update (no crash if it's bind-mounted)
# ✅ Safe ownership update
#if [ -f config/database.yml ] && [ -w config/database.yml ]; then
#  echo "🔐 Attempting to chown database.yml..."
#  chown redmine:redmine config/database.yml || echo "⚠️ Skipped chown: permission denied (likely bind-mounted)"
#fi

export BUNDLE_FORCE_RUBY_PLATFORM=true
chown -R redmine:redmine /usr/src/redmine/vendor
mkdir -p /home/redmine/.bundle/cache && chown -R redmine:redmine /home/redmine/.bundle

#echo "📦 Installing dependencies (bundle install)..."
#bundle install || true
# 🩹 Fix gem + bundler permissions
chmod -R o-w /usr/local/bundle/extensions
chmod +t /usr/local/bundle/extensions
mkdir -p /home/redmine/.bundle/cache
chown -R redmine:redmine /home/redmine/.bundle

echo "📦 Installing dependencies (bundle install)..."
bundle config build.nokogiri --use-system-libraries
# 🎯 Install exact Nokogiri version manually FIRST
gem install nokogiri -v 1.18.3 -- --use-system-libraries
bundle config set --local path 'vendor/bundle' # Optional: avoids polluting system gems


set -e

echo "📦 Checking and installing missing gems..."
bundle check || bundle install

echo "🧠 Running core Redmine DB migrations..."
gosu redmine bundle exec rake db:migrate RAILS_ENV=production || {
  echo "❌ Core DB migration failed."
  exit 1
}

echo "🧠 Running plugin migration: redmine_agile..."
gosu redmine bundle exec rake redmine:plugins:migrate NAME=redmine_agile RAILS_ENV=production || {
  echo "❌ redmine_agile plugin migration failed."
  exit 1
}

echo "🧠 Running all other plugin migrations..."
gosu redmine bundle exec rake redmine:plugins:migrate RAILS_ENV=production || {
  echo "❌ General plugin migration failed."
  exit 1
}


echo "🚀 Launching Redmine server..."
exec /docker-entrypoint.sh "$@"
