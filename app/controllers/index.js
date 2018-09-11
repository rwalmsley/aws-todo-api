const dynamodb = require('../dynamodb');
const uuid = require('uuid');
const moment = require('moment');

const API_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

module.exports.addItem = (request, response) => {
    const timestamp = new Date().getTime();

    const data = request.body;

    let isDue = false, momentDate;
    if (data.dueDate) {
        momentDate = moment.utc(data.dueDate);
        let localMoment = moment(data.dueDate);
        isDue = localMoment.isBefore();
    }
    const id = uuid.v1()

    const params = {
        TableName: process.env.DB_TABLE,
        Item: {
            id,
            title: data.title,
            description: data.description,
            isDue,
            dueDate: momentDate ? momentDate.format(API_DATETIME_FORMAT) : null,
            createdAt: timestamp,
            updatedAt: timestamp,
            isDone: false,
        }
    };

    const putPromise = dynamodb.put(params).promise();

    return putPromise.then(result => {
        if (response) {
            response.send({
                success: true,
                message: 'Todo created successfully',
                id
            });
        }
        
    }).catch(error => {
        if (response) {
            response.send({
                success: false,
                message: `Error: Server error. Message: ${error.message}`,
                error
            });
        }
    });

};

module.exports.listAll = (request, response) => {

    const params = {
        TableName: process.env.DB_TABLE
    };

    const scanPromise = dynamodb.scan(params).promise();

    return scanPromise.then(result => {

        checkTodoListForDue(result.Items, response);

    }).catch(error => {
        if (response) {
            response.send({
                success: false,
                message: `Error: Server error. Message: ${error.message}`
            });
        }
    });
}


module.exports.getItem = (request, response) => {

    const id = request.params.id;

    const params = {
        TableName: process.env.DB_TABLE,
        KeyConditionExpression: 'id = :i',
        ExpressionAttributeValues: {
            ':i': id
        }
    };

    const queryPromise = dynamodb.query(params).promise();
    return queryPromise.then(result => {

        const { Items } = result;
        return checkTodoListForDue(Items, response).then( todos => todos);

    }).catch(error => {
        if (response) {
            response.send({
                success: false,
                message: `Error: Server error. Message: ${error.message}`
            });
        }
        return error;
    });
};


/**
 * Loop through each Todo to check if it is due.
 * @param {Array} items Array of Todo items
 * @param {Object} response The server response object
 */
const checkTodoListForDue = (items, response) => {

    if (items.length > 0) {

        let itemPromises = [];

        items.forEach( item => {
            itemPromises.push(checkIsDue(item));
        });

        return Promise.all(itemPromises).then((todos) => {

            if (response) {
                response.send({
                    success: true,
                    message: `Successfully retrieved todo.`,
                    total: todos.length,
                    todos
                });
            }

            return todos;

        }).catch(error => {
            if (response) {
                response.send({
                    success: false,
                    message: `Error: Server error. Message: ${error.message}`
                });
            }
            return error;
        });

    } else {
        if (response) {
            response.send({
                success: true,
                message: `Successfully retrieved todo.`,
                total: todos.length,
                todos: items
            });
        }
        return Promise.resolve(items);
    }

}


module.exports.deleteItem = (request, response) => {

    const id = request.params.id;

    const params = {
        TableName: process.env.DB_TABLE,
        Key: {
            id
        }
    };

    const deletePromise = dynamodb.delete(params).promise();

    return deletePromise.then(result => {
        if (response) {
            response.send({
                success: true,
                message: `Successfully removed todo.`,
            });
        }
    }).catch(error => {
        if (response) {
            response.send({
                success: false,
                message: `Error: Server error. Message: ${error.message}`
            });
        }
    });

};


module.exports.deleteAll = (request, response) => {

    var scanParams = {
        TableName: process.env.DB_TABLE
    }

    const scanPromise = dynamodb.scan(scanParams).promise();

    return scanPromise.then(data => {
            
        data.Items.forEach((item, idx) => {

            let params = {
                TableName: process.env.DB_TABLE,
                Key: {
                    id: item.id
                },
                ReturnValues: 'NONE',
                ReturnConsumedCapacity: 'NONE',
                ReturnItemCollectionMetrics: 'NONE'
            };

            dynamodb.delete(params, (err, data) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log(data);
                }
            })
        });
        
    }).catch(error => {
        if (response) {
            response.send({
                success: false,
                message: `Error: Server error. Message: ${error.message}`
            });
        }
    });

};


module.exports.updateItem = (request, response) => {

    const timestamp = new Date().getTime();
    const data = request.body;
    const id = request.params.id;

    let updateExpression = 'SET updatedAt = :updatedAt'
    let expressionAttributeNames = {};

    if (data.title) {
        updateExpression += ', #todo_title = :title';
        expressionAttributeNames['#todo_title'] = 'title';
    }

    if (data.description) {
        updateExpression += ', #todo_description = :description';
        expressionAttributeNames['#todo_description'] = 'description';
    }

    if (data.isDone) {
        updateExpression += ', isDone = :isDone';
    }

    if (data.dueDate) {
        updateExpression += ', dueDate = :dueDate';
    }

    const params = {
        TableName: process.env.DB_TABLE,
        Key: {
            id
        },
        ExpressionAttributeValues: {
            ':title': data.title,
            ':description': data.description,
            ':isDone': data.isDone,
            ':updatedAt': timestamp,
            ':dueDate': data.dueDate
        },
        ConditionExpression: 'attribute_exists(id)',
        UpdateExpression: updateExpression,
        ReturnValues: 'ALL_NEW',
    };

    if (Object.keys(expressionAttributeNames).length > 0) {
        params.ExpressionAttributeNames = expressionAttributeNames
    }

    const updatePromise = dynamodb.update(params).promise();

    return updatePromise.then(Item => {

        console.log(Item)
        if (response) {
            response.send({
                success: true,
                message: `Successfully updated todo.`,
                Item
            });
        }
    }).catch(error => {
        if (response) {
            response.send({
                success: false,
                message: `Error: Server error. Message: ${error.message}`
            });
        }
    });

};


module.exports.getAllDue = (request, response) => {

    const params = {
        TableName: process.env.DB_TABLE
    }

    const queryPromise = dynamodb.scan(params).promise();

    return queryPromise.then(result => {

        return checkTodoListForDue(result.Items, null).then( todos => {

            let dueItems = todos.filter( todo => todo.isDue);
            if (response) {
                response.send({
                    success: true,
                    message: `Successfully retrieved due todo list.`,
                    total: dueItems.length,
                    todos: dueItems
                });
            }
        });
        
    }).catch(error => {
        if (response) {
            response.send({
                success: false,
                message: `Error: Server error. Message: ${error.message}`
            });
        }
    });

}


/**
 * Check if a todo item has a due date, and whether or not that due date
 * has past. Update the item if it is now due or if the due date has been updated.
 * @param {Object} todo the todo object
 */
const checkIsDue = (todo) => {

    if (todo.dueDate) {

        let localMoment = moment(todo.dueDate).local();
        let isDue = localMoment.isBefore();

        if (todo.isDue !== isDue) {

            return setIsDue(todo.id, isDue).then(item => {
                return item;
            }).catch(error => {
                return error;
            });
        }
    }
    return Promise.resolve(todo);
}


/**
 * Update isDue field of a todo item.
 * @param {Int} id the ID of the todo
 * @param {Boolean} isDue true if is due, false if it is not
 */
const setIsDue = (id, isDue) => {

    const params = {
        TableName: process.env.DB_TABLE,
        Key: {
            id
        },
        ExpressionAttributeValues: {
            ':isDue': isDue,
        },
        ConditionExpression: 'attribute_exists(id)',
        UpdateExpression: 'SET isDue = :isDue',
        ReturnValues: 'ALL_NEW',
    };

    const updatePromise = dynamodb.update(params).promise();

    return updatePromise.then(result => {
        return result.Attributes;
    }).catch(error => {
        return error;
    });

}