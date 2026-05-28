export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1",
  apiKey: process.env.NEXT_PUBLIC_API_KEY || "",
  cdnUrl:
    process.env.NEXT_PUBLIC_S3_CDN_URL ||
    "https://d3s3b8zw1epdnj.cloudfront.net",
};
