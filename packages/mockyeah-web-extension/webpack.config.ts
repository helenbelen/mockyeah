import path from "path";
import webpack, { Configuration } from "webpack";
import merge from "webpack-merge";
import CopyPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";

type Args = Record<string, boolean | number | string>;

const defaults: (env: Args, argv: Args) => Configuration = (
  { production = process.env.NODE_ENV === "production" } = {},
  argv = {}
) => {
  const plugins = [
    new webpack.EnvironmentPlugin(["NODE_ENV"]),
    new CopyPlugin(
      [
        "./src/manifest.json",
        { from: "./src/icon*.png", to: "[name].[ext]", toType: "template" }
      ],
      {
        copyUnmodified: true
      }
    )
  ];

  return {
    mode: production ? "production" : "development",
    devtool: production ? false : "cheap-module-source-map",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].js"
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".json"]
    },
    module: {
      rules: [
        {
          test: /\.(j|t)sx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "ts-loader",
              query: {
                compilerOptions: {
                  // Enables ModuleConcatenation. It must be in here to avoid conflict with ts-node
                  module: "es2015",
                  // With this, TS will error but the file will still be generated (on watch only)
                  noEmitOnError: argv.watch === false
                }
              }
            }
          ]
        }
      ]
    },
    plugins
  };
};

module.exports = [
  (env: Args = {}, argv: Args = {}) =>
    merge(defaults(env, argv), {
      entry: {
        background: "./src/background/index.ts",
        content: "./src/content/index.ts"
      }
    }),
  (env: Args = {}, argv: Args = {}) =>
    merge(defaults(env, argv), {
      entry: {
        devtools: "./src/devtools/index.tsx"
      },
      plugins: [
        new HtmlWebpackPlugin({
          title: "Mockyeah",
          filename: "devtools.html",
          inject: false,
          template: require("html-webpack-template"),
          appMountId: "app"
        })
      ]
    }),

  (env: Args = {}, argv: Args = {}) =>
    merge(defaults(env, argv), {
      entry: {
        panel: "./src/panel/index.tsx"
      },
      plugins: [
        new HtmlWebpackPlugin({
          title: "Mockyeah",
          filename: "panel.html",
          inject: false,
          template: require("html-webpack-template"),
          appMountId: "app"
        })
      ]
    })
];
