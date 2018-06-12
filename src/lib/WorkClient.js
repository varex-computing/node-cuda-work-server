//Dependencies
import Logger from 'winston';

//Local dependencies

//Instantiated

const WorkClient = class WorkClient {
	constructor(id, socket) {
		this._id = id;
		this._socket = socket;

		this._devices = [];

		this._setSocketHandlers();

		this._requestDeviceInfo();
	}

	////////////////////////
	// GETTERS AND SETTERS//
	////////////////////////

	////////////////////
	// PRIVATE METHODS//
	////////////////////

	_setSocketHandlers() {
		// preserve context
		const _this = this;
		

		_this._socket.on(`device-info`, _this.handleDeviceInfo.bind(_this));
	}

	_requestDeviceInfo() {
		// preserve context
		const _this = this;
		
		Logger.info(`Requesting hardware device details from new client...`);
		_this._socket.emit(`device-request`);
	}

	////////////////////
	// EVENT HANDLERS //
	////////////////////

	handleDeviceInfo(devices) {
		// preserve context
		const _this = this;
		
		Logger.info(`Got device info from client`);
		Logger.info(devices);
		_this._devices = devices;
	}
};

export { WorkClient };
export default WorkClient;
