
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  generateBuildId: () => 'build'
}

export default nextConfig