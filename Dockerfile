# Tracks the latest WordPress release on PHP 8.3 + Apache.
# (Use a pinned tag like `wordpress:6.9-php8.3-apache` if you need a fixed
# WP version for a specific test run.)
FROM wordpress:php8.3-apache

RUN apt-get update && apt-get install -y \
    less \
    default-mysql-client \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# WP-CLI
RUN curl -sL https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    -o /usr/local/bin/wp \
    && chmod +x /usr/local/bin/wp

# Confirm install
RUN wp --info --allow-root
