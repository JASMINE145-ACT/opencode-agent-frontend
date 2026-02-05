const path = require("path");
const glob = require("glob");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");

// 使用 dev server 时输出到独立目录，避免写入 build/ 触发 watch 循环编译
const isDevServer = process.env.WEBPACK_DEV_SERVER === "true";
const outputDir = isDevServer ? ".dev-output" : "build";

const INCLUDE_PATTERN =
  /<include\s+src=["'](.+?)["']\s*\/?>\s*(?:<\/include>)?/gis;

const processNestedHtml = (content, loaderContext, dir = null) =>
  !INCLUDE_PATTERN.test(content)
    ? content
    : content.replace(INCLUDE_PATTERN, (m, src) => {
        const filePath = path.resolve(dir || loaderContext.context, src);
        loaderContext.dependency(filePath);
        return processNestedHtml(
          loaderContext.fs.readFileSync(filePath, "utf8"),
          loaderContext,
          path.dirname(filePath),
        );
      });

// HTML generation（入口页在项目根目录）
const paths = [];
const generateHTMLPlugins = () =>
  glob.sync("./*.html").map((dir) => {
    const filename = path.basename(dir);

    if (filename !== "404.html") {
      paths.push(filename);
    }

    return new HtmlWebpackPlugin({
      filename,
      template: `./${filename}`,
      favicon: path.join(__dirname, "images/favicon.ico"),
      inject: "body",
    });
  });

module.exports = {
  mode: "development",
  entry: "./js/index.js",
  devServer: {
    static: false,
    compress: true,
    port: 3000,
    hot: false,
    liveReload: false,
    watchFiles: [],
    devMiddleware: {
      writeToDisk: false,
      stats: "errors-only",
    },
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  require("autoprefixer")({
                    overrideBrowserslist: ["last 2 versions"],
                  }),
                ],
              },
            },
          },
        ],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        options: {
          preprocessor: processNestedHtml,
        },
      },
    ],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, outputDir),
    clean: true,
    assetModuleFilename: "[path][name][ext]",
  },
  watchOptions: {
    ignored: [
      path.join(__dirname, "build"),
      path.join(__dirname, ".dev-output"),
      path.join(__dirname, "node_modules"),
    ],
  },
  plugins: [
    new webpack.WatchIgnorePlugin({
      paths: [
        path.join(__dirname, "build"),
        path.join(__dirname, ".dev-output"),
      ],
    }),
    ...generateHTMLPlugins(),
    new MiniCssExtractPlugin({
      filename: "style.css",
      chunkFilename: "style.css",
    }),
  ],
  target: "web",
  stats: "errors-only",
};
