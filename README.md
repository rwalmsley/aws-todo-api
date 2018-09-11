# AWS-Todo-API

This example demonstates a simple Todo RESTapi.


```
34.209.155.213/todos [ get | post ]
34.209.155.213/todos/due [ get ]
34.209.155.213/todos/:id [ get | put | delete ]
```

### Todo

Testing can be run with `npm test`

Testing is expected to be done on a local database instance which can be setup here https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html

Ensure the instance is running with

```
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
```

Testing will launch the server and clear the table for each test.