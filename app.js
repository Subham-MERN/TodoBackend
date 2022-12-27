const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let formattedData = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasCategoryAndPriorityProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}'
        AND priority = '${priority}';`;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}'
         AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  const updatedData = data.map((each) => convertResponseObject(each));
  response.send(updatedData);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getAPI2Query = `
    SELECT 
      *
    FROM 
      todo 
    WHERE 
      id = ${todoId};`;
  const result2 = await database.get(getAPI2Query);
  response.send(convertResponseObject(result2));
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postQuery = `
  INSERT INTO
    todo ( id, todo, priority,status,category,due_date)
  VALUES
    (${id}, '${todo}', '${priority}','${status}','${category}','${dueDate}');`;
  await database.run(postQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  let updateTodoQuery = null;

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      if (
        requestBody.status === "TO DO" ||
        requestBody.status === "IN PROGRESS" ||
        requestBody.status === "DONE"
      ) {
        const { status } = request.body;
        updateTodoQuery = `
    UPDATE
      todo
    SET
      status='${status}'
    WHERE
      id = ${todoId};`;
        await database.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);
      } else {
        response.status(400);
        response.send(` Invalid Todo ${updateColumn}`);
      }
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      if (
        requestBody.priority === "HIGH" ||
        requestBody.priority === "MEDIUM" ||
        requestBody.priority === "LOW"
      ) {
        const { priority } = request.body;
        updateTodoQuery = `
    UPDATE
      todo
    SET
      priority='${priority}'
    WHERE
      id = ${todoId};`;
        await database.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);
      } else {
        response.status(400);
        response.send(` Invalid Todo ${updateColumn}`);
      }
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      const { todo } = request.body;
      updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}'
    WHERE
      id = ${todoId};`;
      await database.run(updateTodoQuery);
      response.send(`${updateColumn} Updated`);
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      if (
        requestBody.category === "WORK" ||
        requestBody.category === "HOME" ||
        requestBody.category === "LEARNING"
      ) {
        const { category } = request.body;
        updateTodoQuery = `
    UPDATE
      todo
    SET
      category='${category}'
    WHERE
      id = ${todoId};`;
        await database.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);
      } else {
        response.status(400);
        response.send(` Invalid Todo ${updateColumn}`);
      }
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      const { dueDate } = request.body;
      updateTodoQuery = `
    UPDATE
      todo
    SET
      due_date='${format(new Date(dueDate), "yyyy-MM-dd")}'
    WHERE
      id = ${todoId};`;
      await database.run(updateTodoQuery);
      response.send(`${updateColumn} Updated`);
      break;
  }
});

app.get("/agenda/", async (request, response) => {
  const { date = "" } = request.query;
  const getAPI3Query = `
    SELECT 
      *
    FROM 
      todo 
    WHERE 
    due_date = ${date};`;
  const result3 = await database.get(getAPI3Query);
  const updatedData3 = result3.map((each) => convertResponseObject(each));
  response.send(updatedData3);
});

module.exports = app;
