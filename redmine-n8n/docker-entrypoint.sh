#!/bin/bash
set -e

echo "🔧 Waiting for DB to be ready..."
until mysql -h"$REDMINE_DB_MYSQL" -u"$REDMINE_DB_USERNAME" -p"$REDMINE_DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; do
  sleep 2
done

echo "🔄 Running DB migrations..."
bundle exec rake db:migrate RAILS_ENV=production || true
bundle exec rake redmine:plugins:migrate RAILS_ENV=production || true

echo "🚀 Starting Redmine..."
exec "$@"
