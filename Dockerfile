FROM wordpress:6.4-php8.2-apache

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
