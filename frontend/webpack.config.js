const path = require("path");

module.exports = {
  target: "web",
  entry: "./background.js",
  resolve: {
    alias: {
      // vm: require.resolve("vm-browserify"),
      // querystring: require.resolve("querystring-es3")
      // path: require.resolve("path-browserify"),
      os: require.resolve("os-browserify/browser"),
      querystring: require.resolve("querystring-es3"),
      util: require.resolve("util/"),
      url: require.resolve("url/"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer/"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      // // crypto: require.resolve("crypto-browserify"),
      assert: require.resolve("assert/"),
      // // constants: require.resolve("constants-browserify"),
      // // fs: require.resolve("write-file-atomic"),
      tls: require.resolve("resolve-alpn"),
      net: require.resolve("http2-wrapper/"),
      http2: require.resolve("http2-wrapper/"),
      zlib: require.resolve("browserify-zlib"),
      dns: require.resolve("cacheable-lookup"),
      fs: require.resolve("got/")
    }
  },
  optimization: {
    minimize: false
  }
  // resolve: {
  //   fallback: {
  //     util: require.resolve("./node_modules/util/")
  //   }
  // }
  // resolve: {
  //   modules: ["./src", "./node_modules"],
  //   alias: {
  //     react: "preact/compat",
  //     "react-dom": "preact/compat"
  //   }
  // }
};

// const webpack = require('webpack')
// const CopyWebpackPlugin = require('copy-webpack-plugin')
// const GenerateJsonPlugin = require('generate-json-webpack-plugin')
// const merge = require('webpack-merge')

// // markdown convert to html
// const marked = require('marked')
// const renderer = new marked.Renderer()

// module.exports = function (env, argv) {
//   console.log(env);
//     const [browser] = env.split(':')
//     const version = require('./manifest/common.json').version

//   const config = {
//     entry: {
//       background_page: "./background.js",
//         content_script: './src/content_script/index.js',
//         content_script_loader: './src/content_script/loader.js',
//         info: './src/pages/info/index.js',
//       options: "./options.js",
//     },
//     output: {
//       path: path.join(__dirname, "/dist"),
//       filename: "[name].js",
//       sourceMapFilename: "[name].js.map", // always generate source maps
//     },
//     devtool: argv.mode === "production" ? "source-map" : "inline-source-map",
//     module: {
//       rules: [
//         {
//           test: /\.js$/,
//           exclude: /node_modules/,
//           loader: "babel-loader",
//         },
//         {
//           test: /\.css$/,
//           use: ["style-loader", "css-loader"],
//         },
//         {
//           test: /\.md$/,
//           use: [
//             {
//               loader: "html-loader",
//             },
//             {
//               loader: "markdown-loader",
//               options: {
//                 renderer,
//               },
//             },
//           ],
//         },
//       ],
//     },
//     resolve: {
//       modules: ["./src", "./node_modules"],
//       alias: {
//         react: "preact/compat",
//         "react-dom": "preact/compat",
//       },
//     },
//     plugins: [
//       new CopyWebpackPlugin([
//         {
//           from: "static",
//         },
//         {
//           context: "src/options",
//           from: "**/default.json",
//           to: "default_[folder].json",
//         },
//         {
//           context: "src/options",
//           from: "**/config.json",
//           to: "config_[folder].json",
//         },
//       ]),
//       new GenerateJsonPlugin(
//         "manifest.json",
//         merge(
//           require("./manifest/common.json"),
//           require(`./manifest/${browser}.json`),
//           { version }
//         ),
//         null,
//         2
//       ),
//     ],
//   };
// };
