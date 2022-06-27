import 'dotenv/config';

import sveltePreprocess from "svelte-preprocess";
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import webpack from "webpack";
const { DefinePlugin } = webpack;


const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

export default  {
	entry: {
		'build/bundle': ['./svelte/main.ts']
	},
	resolve: {
		extensions: ['.mjs', '.js', '.svelte', '.ts'],
		mainFields: ['svelte', 'module', 'main']
	},
	output: {
		path: path.join(__dirname, '/static/js'),
		filename: 'svelte.js',
		// chunkFilename: '[name].[id].js'
	},
	module: {
		rules: [
			{
				test: /\.svelte$/,
				use: {
					loader: 'svelte-loader',
					options: {
						compilerOptions: {
							dev: !prod,
						},
						emitCss: prod,
						hotReload: !prod,
						preprocess: sveltePreprocess({
							typescript: {
								tsconfigDirectory: __dirname,
								tsconfigFile: "tsconfig.json"
							}
						})
					}
				}
			},
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.css$/i,
				use: [MiniCssExtractPlugin.loader, "css-loader"],
			},
			{
				// required to prevent errors from Svelte on Webpack 5+
				test: /node_modules\/svelte\/.*\.mjs$/,
				resolve: {
					fullySpecified: false
				}
			}
		]
	},
	mode,
	plugins: [
		new DefinePlugin({
			'process.env': JSON.stringify({ DATASUB_URL: process.env.DATASUB_URL , ENV: process.env.ENV })
		}),
		new MiniCssExtractPlugin({
			filename: '../css/svelte.css'
		})
	],
	devtool: prod ? false : 'source-map'
};