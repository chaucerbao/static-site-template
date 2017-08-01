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
const webpack = require('webpack')
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
  webpack(
    {
      entry: path.resolve(src, 'js', 'index.ts'),
      output: {
        filename: 'script.js',
        path: path.resolve(dest, 'js')
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            use: 'ts-loader'
          }
        ]
      },
      plugins: [new webpack.optimize.UglifyJsPlugin()],
      devtool: isProduction ? 'source-map' : 'cheap-module-eval-source-map'
    },
    (err, stats) => {
      if (err) {
        throw new gutil.PluginError('Webpack', err)
      }

      if (stats.hasErrors()) {
        gutil.log('[Webpack]', stats.toString('minimal'))
      }

      browserSync.reload(path.join(dest, 'js', 'script.js'))
      callback()
    }
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
  gulp.watch(path.join(src, '**', '*.ts'), ['js'])
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
