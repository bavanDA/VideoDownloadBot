# Use an official Node.js image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Compile TypeScript
RUN npm run build-ts

# Expose the application port (change if needed)
EXPOSE 3000

# Start the app
CMD ["node", "dist/app.js"]
