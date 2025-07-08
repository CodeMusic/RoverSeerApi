# ✅ Base Redmine image
FROM redmine:6

# ✅ Environment setup (optional but helpful)
ENV BUNDLE_FORCE_RUBY_PLATFORM=true \
    NOKOGIRI_USE_SYSTEM_LIBRARIES=true

# ✅ Install dependencies BEFORE gems
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

RUN rm -rf /usr/src/redmine/vendor/bundle/ruby/3.3.0/gems/nokogiri*
RUN bundle config build.nokogiri --use-system-libraries

# ✅ Install critical Ruby gems
RUN gem install json -v 2.12.2 -- --with-cflags="-Wno-error=implicit-function-declaration"
RUN gem install simplecov-cobertura

# ✅ Rebuild mysql2 gem with native bindings
RUN gem uninstall -x -I mysql2 || true && \
    gem install mysql2 -v 0.5.6 -- --with-mysql-config=/usr/bin/mysql_config

# ✅ Copy in custom entrypoint if you have one
# COPY docker-entrypoint.sh /usr/local/bin/
# RUN chmod +x /usr/local/bin/docker-entrypoint.sh
# ENTRYPOINT ["docker-entrypoint.sh"]

# Default CMD (can be overridden in docker-compose)
# CMD ["rails", "server", "-b", "0.0.0.0"]
