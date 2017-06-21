// Dependencies
const path = require('path')
const gulp = require('gulp')
const pump = require('pump')
const del = require('del')
const concat = require('gulp-concat')
const sourcemaps = require('gulp-sourcemaps')
const gutil = require('gulp-util')
const pug = require('gulp-pug')
const sass = require('gulp-sass')
const cssnano = require('gulp-cssnano')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify')
const svgSprite = require('gulp-svg-sprite')
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
    gulp.src(path.join(src, '**', '*.scss')),
    isProduction ? gutil.noop() : sourcemaps.init(),
    concat(path.join('css', 'style.css')),
    sass({ includePaths: [src, 'node_modules'] }),
    cssnano({ autoprefixer: { add: true } }),
    isProduction ? gutil.noop() : sourcemaps.write(),
    gulp.dest(dest),
    isProduction ? gutil.noop() : browserSync.stream(),
    callback
  )
})

// Build Javascript
gulp.task('js', callback => {
  pump(
    gulp.src(path.join(src, '**', '*.js')),
    isProduction ? gutil.noop() : sourcemaps.init(),
    concat(path.join('js', 'script.js')),
    babel({ presets: ['env'] }),
    uglify(),
    isProduction ? gutil.noop() : sourcemaps.write(),
    gulp.dest(dest),
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
          dest: 'icon',
          sprite: 'symbol.svg'
        }
      }
    }),
    gulp.dest(dest),
    callback
  )
})

// Development
gulp.task('watch', ['default'], () => {
  gulp.watch(path.join(src, '**', '*.pug'), ['html'])
  gulp.watch(path.join(src, '**', '*.scss'), ['css'])
  gulp.watch(path.join(src, '**', '*.js'), ['js'])
  gulp.watch(path.join(src, 'icon', '**', '*.svg'), ['icon'])

  browserSync.init({
    server: dest,
    open: false
  })
})

// Clean up
gulp.task('clean', () => del(dest))

// Build
gulp.task('default', ['html', 'css', 'js', 'icon'])
