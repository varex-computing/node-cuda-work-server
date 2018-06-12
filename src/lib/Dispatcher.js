//Dependencies
import uniqid from 'uniqid';
import Logger from 'winston';

//Local dependencies
import WorkClient from './WorkClient';

//Instantiated
const workClients = {};

const Dispatcher = class Dispatcher {
	constructor() {

	}

	////////////////////
	// PUBLIC METHODS //
	////////////////////

	addWorker(workerSocket) {
		// preserve context
		const _this = this;
		
		const clientId = uniqid();
		const client = new WorkClient(clientId, workerSocket);
		workClients[clientId] = client;

		workerSocket.on(`disconnect`, _this.handleClientDisconnect.bind(_this, clientId));
	}

	////////////////////
	// EVENT HANDLERS //
	////////////////////

	handleClientDisconnect(clientId) {
		Logger.info(`Client disconnected`);
		delete workClients[clientId];
	}
};

export { Dispatcher };
export default Dispatcher;
