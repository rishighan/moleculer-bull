"use strict";

let { ServiceBroker } 	= require("moleculer");
let BullService			= require("../../index");

let broker = new ServiceBroker({ logger: console });

broker.createService({
	name: "pub",
	mixins: [BullService()],

	started() {
		let id = 1;
		setInterval(() => {
			this.logger.info("Add a new job. ID:", id);
			this.createJob("sample.task", { id: id++, pid: process.pid });
		}, 2000);

		this.getQueue("sample.task").on("global:progress", (jobID, progress) => {
			this.logger.info(`Job #${jobID} progress is ${progress}%`);
		});

		this.getQueue("sample.task").on("global:completed", (job, res) => {
			this.logger.info(`Job #${job.id} completed!. Result:`, res);
		});
	}
});

broker.createService({
	name: "task-worker",
	mixins: [BullService()],

	queues: {
		"sample.task"(job) {
			this.logger.info("New job received!", job.data);
			job.progress(10);

			return new this.Promise(resolve => {
				setTimeout(() => resolve({
					done: true,
					id: job.data.id,
					worker: process.pid
				}), 500);
			});
		}
	}
});

broker.start();
