import nodeExternals from 'webpack-node-externals';

const common = (env = {}) => ({
  mode: env.dev ? 'development' : 'production',
  devtool: env.dev ? 'source-map' : undefined,
  entry: './src/index.ts',
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [
      {
        test: /\.[jt]s$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      {
        test: /\.js$/,
        use: 'source-map-loader',
        enforce: 'pre'
      }
    ]
  }
});

export default [
  env => ({
    ...common(env),
    entry: './src/normalize.ts',
    target: 'node',
    externals: [nodeExternals()],
    output: {
      filename: 'normalize.ts',
      libraryTarget: 'commonjs2',
      libraryExport: 'default'
    }
  }),
  env => ({
    ...common(env),
    target: 'node',
    externals: [nodeExternals()],
    output: {
      libraryTarget: 'commonjs2',
      libraryExport: 'default'
    }
  }),
  env => ({
    ...common(env),
    output: {
      filename: 'browser.js',
      library: 'Mockyeah',
      libraryTarget: 'var',
      libraryExport: 'default'
    }
  })
];
