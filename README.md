# WARNING: THIS IS VERY UNFINSHED AND SHIT

# Vidbytez
Vidbytez is an open source clone of [Vidlii](http://vidlii.com) written in JavaScript. The majority of the frontend CSS and HTML are taken directly from [Vidlii](http://vidlii.com) with the blessing of the site's admin, [Jan](https://github.com/JanEul/), with 100% of the backend and frontend JS being written by me. (Unless you want to contribute, then that number might change...!)

## Dependencies
* NodeJS
* npm
* MongoDB
* ffmpeg

## How do I run it?
Run `npm install` in the cloned directory, ensure MongoDB is installed and running, change `example.config.json` to reflect your
desired configuration, and rename it to `config.json`. Run using `node src/vidbytez.js`, or perferably run the application using [pm2](https://www.npmjs.com/package/pm2) for production purposes.

## Why?
because fuck you