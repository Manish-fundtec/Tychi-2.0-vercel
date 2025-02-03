import mongoose from "mongoose";
const MONGODB_URI = 'mongodb://localhost:27017/tychiui';

const connection = {};

async function connect() {
	if (connection.isConnected) {
		console.log("already connected");
		return;
	}
	if (mongoose.connections.length > 0) {
		connection.isConnected = mongoose.connections[0].readyState;
		if (connection.isConnected === 1) {
			console.log("use previous connection");
			return;
		}
		await mongoose.disconnect();
	}
	const options = {
		
		connectTimeoutMS: 30000, // 30 seconds
		socketTimeoutMS: 45000   // 45 seconds
	  };

	// console.log("process.env.MONGODB_URI",process.env.MONGODB_URI);
	const db = await mongoose.connect(process.env.MONGODB_URI, options);
	
	console.log("new connection");
	connection.isConnected = db.connections[0].readyState;
}

async function disconnect() {
	if (connection.isConnected) {
		if (process.env.NODE_ENV === "production") {
			await mongoose.disconnect();
			connection.isConnected = false;
		} else {
			console.log("not disconnected");
		}
	}
}

const db = {
	connect: async () => {
	  if (mongoose.connection.readyState === 0) {
		await mongoose.connect(MONGODB_URI, {
		  useNewUrlParser: true,
		  useUnifiedTopology: true,
		});
		console.log("Connected to MongoDB");
	  }
	},
	disconnect: async () => {
	  if (mongoose.connection.readyState !== 0) {
		await mongoose.disconnect();
		console.log("Disconnected from MongoDB");
	  }
	},
  };

export default db;
