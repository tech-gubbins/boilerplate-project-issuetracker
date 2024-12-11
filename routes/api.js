'use strict';

const { MongoClient, ObjectId } = require('mongodb');

module.exports = function (app) {
	const client = new MongoClient(process.env.MONGO_URI);
	app
		.route('/api/issues/:project')
		.get(function (req, res) {
			let project = req.params.project;
			try {
				client.connect().then(() => {
					const collection = client.db().collection(project);
					const query = req.query;

					if (query._id) query._id = ObjectId.createFromHexString(query._id);
					if (query.open === '' || query.open === 'true') query.open = true;
					else if (query.open === 'false') query.open = false;

					const issues = collection.find(req.query ?? {});

					issues.toArray().then((result) => {
						res.send(result);
					});
				});
			} catch (error) {
				res.send(error);
				res.status(400);
			}
		})
		.post(function (req, res) {
			let project = req.params.project;
			let projectData = req.body;

			if (
				!projectData.issue_title ||
				!projectData.issue_text ||
				!projectData.created_by
			) {
				return res.send({ error: 'required field(s) missing' });
			}

			const newIssue = {
				assigned_to: '',
				status_text: '',
				open: true,
				...projectData,
				created_on: new Date(),
				updated_on: new Date(),
			};

			try {
				client.connect().then(() => {
					const collection = client.db().collection(project);
					collection
						.insertOne(newIssue)
						.then((doc) => {
							newIssue._id = doc.insertedId;
							res.json(newIssue);
						})
						.catch((error) => {
							res.send(error);
							res.status(400);
						});
				});
			} catch (error) {
				res.send(error);
				res.status(400);
			}
		})
		.put(function (req, res) {
			let project = req.params.project;

			const updates = { ...req.body };
			delete updates._id;

			if (!req.body._id) {
				return res.send({ error: 'missing _id' });
			}

			if (!Object.keys(updates).length) {
				return res.send({
					error: 'no update field(s) sent',
					_id: req.body._id,
				});
			}

			try {
				client.connect().then(async () => {
					const collection = client.db().collection(project);
					collection
						.findOneAndUpdate(
							{ _id: ObjectId.createFromHexString(req.body._id) },
							{ $set: { ...updates, updated_on: new Date() } },
							{ returnNewDocument: false }
						)
						.then((doc) => {
							res.send({
								result: 'successfully updated',
								_id: doc._id.toString(),
							});
						})
						.catch((error) => {
							res.send({ error: 'could not update', _id: req.body._id });
							res.status(400);
						});
				});
			} catch (error) {
				res.send({ error: 'could not update', _id: req.body._id });
        res.status(400);
			}
		})
		.delete(function (req, res) {
			if (!req.body._id) {
				return res.send({ error: 'missing _id' });
			}

			let project = req.params.project;

			try {
				client.connect().then(() => {
					const collection = client.db().collection(project);
					collection
						.findOneAndDelete({
							_id: ObjectId.createFromHexString(req.body._id),
						})
						.then((doc) => {
							if (!doc)
								return res.send({
									error: 'could not delete',
									_id: req.body._id,
								});
							res.send({
								result: 'successfully deleted',
								_id: doc._id.toString(),
							});
						})
						.catch((error) => {
							res.send({ error: 'could not delete', _id: req.body._id });
						});
				});
			} catch (error) {
				res.send({ error: 'could not delete', _id: req.body._id });
			}
		});
};
