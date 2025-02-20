# Use an official Node.js image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Copy package.json and package-lock.json first to leverage Docker's caching
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Compile TypeScript filesv
RUN npm run build-ts

# Expose the application port (change if needed)
EXPOSE 3000

# Start the app using the compiled JavaScript
CMD ["node", "app/dist/app.js"]
