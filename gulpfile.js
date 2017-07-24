// Dependencies
const path = require('path')
const gulp = require('gulp')
const pump = require('pump')
const del = require('del')
const sourcemaps = require('gulp-sourcemaps')
const gutil = require('gulp-util')
const pug = require('gulp-pug')
const sass = require('gulp-sass')
const cssnano = require('gulp-cssnano')
const browserify = require('browserify')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
const uglify = require('gulp-uglify')
const svgSprite = require('gulp-svg-sprite')
const critical = require('critical').stream
const browserSync = require('browser-sync').create()

// File paths
const src = 'src'
const dest = 'dist'

// Determine the environment
const isProduction = process.env.NODE_ENV === 'production'

// Build HTML
gulp.task('html', callback => {
  pump(
    gulp.src([
      path.join(src, '**', '*.pug'),
      `!${path.join(src, '_lib', '**', '*.pug')}`
    ]),
    pug({ basedir: src }),
    gulp.dest(dest),
    isProduction ? gutil.noop() : browserSync.stream(),
    callback
  )
})

// Build CSS
gulp.task('css', callback => {
  pump(
    gulp.src(path.join(src, 'css', 'style.scss')),
    isProduction ? gutil.noop() : sourcemaps.init(),
    sass({ includePaths: [src, 'node_modules'] }),
    cssnano({ autoprefixer: { add: true } }),
    isProduction ? gutil.noop() : sourcemaps.write(),
    gulp.dest(path.join(dest, 'css')),
    isProduction ? gutil.noop() : browserSync.stream(),
    callback
  )
})

// Build Javascript
gulp.task('js', callback => {
  pump(
    browserify(path.join(src, 'js', 'script.js'), {
      debug: !isProduction
    }).bundle(),
    source('script.js'),
    buffer(),
    isProduction ? gutil.noop() : sourcemaps.init({ loadMaps: true }),
    uglify(),
    isProduction ? gutil.noop() : sourcemaps.write(),
    gulp.dest(path.join(dest, 'js')),
    isProduction ? gutil.noop() : browserSync.stream(),
    callback
  )
})

// Build Icons
gulp.task('icon', callback => {
  pump(
    gulp.src(path.join(src, 'icon', '**', '*.svg')),
    svgSprite({
      mode: {
        symbol: {
          dest: '',
          sprite: 'symbol.svg'
        }
      }
    }),
    gulp.dest(path.join(dest, 'icon')),
    callback
  )
})

// Development
gulp.task('watch', ['default'], () => {
  gulp.watch(path.join(src, '**', '*.pug'), ['html'])
  gulp.watch(path.join(src, '**', '*.scss'), ['css'])
  gulp.watch(path.join(src, '**', '*.js'), ['js'])
  gulp.watch(path.join(src, '**', '*.svg'), ['icon'])

  browserSync.init({
    server: dest,
    open: false
  })
})

// Clean up
gulp.task('clean', () => del(dest))

// Extract critical CSS into the HTML
gulp.task('critical', ['html', 'css'], callback => {
  pump(
    gulp.src(path.join(dest, '**', '*.html')),
    critical({
      base: dest,
      inline: true,
      minify: true
    }),
    gulp.dest(dest),
    callback
  )
})

// Build
gulp.task('default', ['html', 'css', 'js', 'icon'])
