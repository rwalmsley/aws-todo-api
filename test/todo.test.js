process.env.NODE_ENV = 'test';

const app = require('../server');
const expect = require('expect');

const request = require('supertest');
const Todos = require('../app/controllers');
const Table = require('../app/table');

const todos = [{
    title: 'First test todo',
    description: 'Some items to do',
    dueDate: new Date()
}];

console.log("Running tests", new Date().toISOString());

describe('Todos', () => {
    beforeEach((done) => {
        Table.deleteTable()
        .then(() => Table.createTable())
        .then(() => done())
        .catch(error => {
            console.error(error);
            done();
        });
    });

    after((done) => {
        // Close our server
        app.close();
        done();
    })

    describe('/POST todos', () => {
        it('should create a new todo', (done) => {
            let id;

            request(app)
            .post('/todos')
            .send(todos[0])
            .expect(200)
            .expect(res => {
                expect(typeof res.body.id).toBe('string');
                id = res.body.id;
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                Todos.getItem({ params: { id }}).then((todos) => {
                    expect(todos.length).toBe(1);
                    expect(todos[0].id).toBe(id);
                    done();
                }).catch((e) => done(e));
            });
        });

        it('should not create todo with invalid data', (done) => {

            request(app)
            .post('/todos')
            .send({})
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todos.listAll().then(todos => {
                    expect(todos.length).toBe(0);
                    done()
                }).catch(err => done(err));
            })
        });
    });


    describe('/GET todos', () => {
        it('it should GET all the todos', (done) => {
            request(app)
            .get('/todos')
            .expect(200)
            .expect(res => {
                expect(res.body.todos.length).toBe(0);
            })
            .end(done);
        });
    });


    describe('/GET todos/:id', () => {
        it('should return todo doc', (done) => {
            let id;

            request(app)
            .post('/todos')
            .send(todos[0])
            .expect(200)
            .expect(res => {
                expect(typeof res.body.id).toBe('string');
                id = res.body.id;
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                request(app)
                .get(`/todos/${id}`)
                .expect(200)
                .expect(res => {
                    expect(res.body.todos[0].title).toBe(todos[0].title)
                })
                .end(done);
            })
        });
    })


});

