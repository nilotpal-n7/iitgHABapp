FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
# We will dynamically pass the PORT variable via the deployment script
EXPOSE 3000 
CMD ["node", "index.js"]
