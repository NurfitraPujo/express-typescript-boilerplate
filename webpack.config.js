require("dotenv-expand")(
    require("dotenv").config({
        path: path.join(__dirname, ".env"),
    })
);

const nodeExternals = require("webpack-node-externals");
const webpack = require("webpack");
const path = require("path");
const TSConfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const { NODE_ENV } = process.env;

const CONFIG = /^CONFIG/i;

function vars() {
    const raw = Object.keys(process.env)
        .filter(key => CONFIG.test(key))
        .reduce(
            (env, key) => {
                env[key] = process.env[key];

                return env;
            },
            {
                NODE_ENV,
                PUBLIC_URL: "/",
                PORT: 5000,
            }
        );
    const stringified = {
        "process.env": Object.keys(raw).reduce((env, key) => {
            env[key] = JSON.stringify(raw[key]);

            return env;
        }, {}),
    };

    return { raw, stringified };
}

const { stringified } = vars();

module.exports = function (_env, arg) {
    const isProduction = arg.mode === "production";
    const isDevelopment = !isProduction;
    return {
        target: "node",
        node: {
            __filename: false,
            __dirname: false,
        },
        externals: [nodeExternals()],
        entry: path.resolve(__dirname, "src", "index.ts"),
        mode: NODE_ENV,
        devtool: "source-map",
        resolve: {
            plugins: [new TSConfigPathsPlugin()],
            extensions: [".ts", ".js"],
        },
        output: {
            filename: "[name]-bundle.js",
            chunkFilename: "[name].chunk.js",
            path: path.resolve(__dirname, "./dist"),
            publicPath: "/",
            libraryTarget: "commonjs2",
        },
        optimization: {
            splitChunks: {
                automaticNameDelimiter: "_",
                cacheGroups: {
                    vendor: {
                        name: "vendor",
                        test: /[\\/]node_modules[\\/]/,
                        chunks: "initial",
                        minChunks: 2,
                    },
                },
            },
        },
        resolve: {
            extensions: [".js", ".ts"],
        },
        module: {
            rules: [
                {
                    test: /\.(jsx|js)$/,
                    include: path.resolve(__dirname, "src"),
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: "babel-loader",
                            options: {
                                cacheDirectory: true,
                                cacheCompression: false,
                                envName: isProduction
                                    ? "production"
                                    : "development",
                                presets: [
                                    [
                                        "@babel/preset-env",
                                        {
                                            targets: "defaults",
                                        },
                                    ],
                                    "@babel/preset-react",
                                ],
                            },
                        },
                    ],
                },
                {
                    test: /\.ts(x?)$/,
                    exclude: /node_modules/,
                    use: [
                        { loader: "ts-loader" },
                        {
                            loader: "eslint-loader",
                            options: {
                                fix: true,
                            },
                        },
                    ],
                },
            ],
        },
        watch: true,
        plugins: [
            new webpack.DefinePlugin(stringified),
            new CleanWebpackPlugin(),
        ],
    };
};
