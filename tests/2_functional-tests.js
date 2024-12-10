const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
	suite('POST /api/issues/{project} => object with issue data', () => {
		test('Every field filled in', (done) => {
			chai
				.request(server)
				.post('/api/issues/test')
				.send({
					issue_title: 'Title',
					issue_text: 'Text',
					created_by: 'Fn Test - Every field filled in',
					assigned_to: 'Joshua',
					status_text: 'In progress',
				})
				.end((_err, res) => {
					assert.equal(res.status, 200);
					done();
				});
		}).timeout(3000);

		test('Required fields filled in', (done) => {
			chai
				.request(server)
				.post('/api/issues/test')
				.send({
					issue_title: 'Title',
					issue_text: 'Text',
					created_by: 'Fn Test - Required fields filled in',
				})
				.end((_err, res) => {
					assert.equal(res.status, 200);
					done();
				});
		}).timeout(3000);

		test('Missing required fields', (done) => {
			chai
				.request(server)
				.post('/api/issues/test')
				.send({
					issue_text: 'Text',
					created_by: 'Fn Test - Missing required fields',
				})
				.end((_err, res) => {
					assert.equal(res.status, 400);
					assert.deepEqual(res.body, { error: 'required field(s) missing' });
					done();
				});
		}).timeout(3000);
	});

	suite('GET /api/issues/{project} => Array of objects with issue data', () => {
		test('No filter', (done) => {
			chai
				.request(server)
				.get('/api/issues/test')
				.query({})
				.end((_err, res) => {
					assert.equal(res.status, 200);
					assert.isArray(res.body);
					assert.property(res.body[0], 'issue_title');
					assert.property(res.body[0], 'issue_text');
					assert.property(res.body[0], 'created_on');
					assert.property(res.body[0], 'updated_on');
					assert.property(res.body[0], 'created_by');
					assert.property(res.body[0], 'assigned_to');
					assert.property(res.body[0], 'open');
					assert.property(res.body[0], 'status_text');
					assert.property(res.body[0], '_id');

					lastObject = res.body.pop();
					done();
				});
		}).timeout(3000);

		test('One filter', (done) => {
			chai
				.request(server)
				.get('/api/issues/test')
				.query({
					open: true,
				})
				.end((_err, res) => {
					assert.equal(res.status, 200);
					const firstIssue = res.body[0];
					assert.equal(firstIssue.project, 'test');
					done();
				});
		}).timeout(3000);

		test('Multiple filters (test for multiple fields you know will be in the db for a return)', (done) => {
			chai
				.request(server)
				.get('/api/issues/test')
				.query({
					open: true,
					assigned_to: 'Joshua',
					status_text: 'In progress',
				})
				.end((_err, res) => {
					assert.equal(res.status, 200);
					const firstIssue = res.body[0];
					assert.equal(firstIssue.status_text, 'In progress');
					done();
				});
		}).timeout(3000);
	});

	suite('PUT /api/issues/{project} => text', () => {
		test('No body and no _id', (done) => {
            chai.request(server)
                .put('/api/issues/test')
                .send({})
                .end((_err, res) => {
                    assert.equal(res.status, 400);
                    assert.deepEqual(res.body, { error: 'missing _id' });
                    done();
                })
        }).timeout(3000);

        test('Invalid _id', (done) => {
            const id = '7758a118017dcc91079081b9'

            chai.request(server)
                .put('/api/issues/test')
                .send({
                    _id: id,
                    issue_title: 'Title',
                    issue_text: 'Text',
                    assigned_to: 'Joshua',
                    open: false,
                    status_text: 'In progress'
                })
                .end((_err, res) => {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, `could not update ${id}`);
                    done()
                })
        }).timeout(3000);
	});
});
