// Exists for shadcn/ui CLI compatibility — the actual build uses @tailwindcss/vite.
module.exports = {
	plugins: {
		"@tailwindcss/postcss": {},
		autoprefixer: {},
	},
};
