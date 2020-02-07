const webpack = require("webpack");
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const srcDir = '../src/';

module.exports = {
    entry: {
        popup: path.join(__dirname, srcDir + 'popup.ts'),
        options: path.join(__dirname, srcDir + 'options.ts'),
        background: path.join(__dirname, srcDir + 'background.ts'),
        content_script: path.join(__dirname, srcDir + 'content_script.ts'),
        performance: path.join(__dirname, srcDir + 'performance.ts'),
        manage: path.join(__dirname, srcDir + 'manage.ts'),
        export: path.join(__dirname, srcDir + 'export.ts'),
        import: path.join(__dirname, srcDir + 'import.ts'),
        analyze_overview: path.join(__dirname, srcDir + 'analyze_overview.ts'),
        analyze_team: path.join(__dirname, srcDir + 'analyze_team.ts')
    },
    output: {
        path: path.join(__dirname, '../dist/js'),
        filename: '[name].js'
    },
    optimization: {
        splitChunks: {
            name: 'vendor',
            chunks: "initial"
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    plugins: [
        // exclude locale files in moment
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new CopyPlugin([
            { from: '.', to: '../' }
          ],
          {context: 'public' }
        ),
    ]
};
