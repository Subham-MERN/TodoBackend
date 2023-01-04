const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
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
    dueDate: format(new Date(dbObject.due_date), "yyyy-MM-dd"),
  };
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    (requestQuery.priority === "HIGH" ||
      requestQuery.priority === "MEDIUM" ||
      requestQuery.priority === "LOW") &&
    (requestQuery.status === "TO DO" ||
      requestQuery.status === "IN PROGRESS" ||
      requestQuery.status === "DONE")
  );
};
const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    (requestQuery.category === "WORK" ||
      requestQuery.category === "HOME" ||
      requestQuery.category === "LEARNING") &&
    (requestQuery.status === "TO DO" ||
      requestQuery.status === "IN PROGRESS" ||
      requestQuery.status === "DONE")
  );
};
const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    (requestQuery.category === "WORK" ||
      requestQuery.category === "HOME" ||
      requestQuery.category === "LEARNING") &&
    (requestQuery.priority === "HIGH" ||
      requestQuery.priority === "MEDIUM" ||
      requestQuery.priority === "LOW")
  );
};

const hasPriorityProperty = (requestQuery) => {
  return (
    requestQuery.priority === "HIGH" ||
    requestQuery.priority === "MEDIUM" ||
    requestQuery.priority === "LOW"
  );
};

const hasStatusProperty = (requestQuery) => {
  return (
    requestQuery.status === "TO DO" ||
    requestQuery.status === "IN PROGRESS" ||
    requestQuery.status === "DONE"
  );
};

const hasCategoryProperty = (requestQuery) => {
  return (
    requestQuery.category === "WORK" ||
    requestQuery.category === "HOME" ||
    requestQuery.category === "LEARNING"
  );
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let formattedData = null;
  let getTodosQuery = "";
  let updatedData = "";

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

      data = await database.all(getTodosQuery);
      if (data !== undefined) {
        updatedData = data.map((each) => convertResponseObject(each));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
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
  if (data !== undefined) {
    const updatedData = data.map((each) => convertResponseObject(each));
    response.send(updatedData);
  } else {
    switch (false) {
      case hasPriorityProperty(request.query):
        response.status(400);
        response.send("Invalid Todo Priority");

        break;
      case hasCategoryProperty(request.query):
        response.status(400);
        response.send("Invalid Todo Category");

        break;
      case hasStatusProperty(request.query):
        response.status(400);
        response.send("Invalid Todo Status");

        break;
    }
  }
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
  if (status !== "TO DO" || status !== "IN PROGRESS" || status !== "DONE") {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    category !== "WORK" ||
    category !== "HOME" ||
    category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (
    priority !== "HIGH" ||
    priority !== "MEDIUM" ||
    priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (!isValid(new Date(dueDate))) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const postQuery = `
  INSERT INTO
    todo ( id, todo, priority,status,category,due_date)
  VALUES
    (${id}, '${todo}', '${priority}','${status}','${category}','${format(
      new Date(dueDate),
      "yyyy-MM-dd"
    )}');`;
    await database.run(postQuery);
    response.send("Todo Successfully Added");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
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
        response.send(`Invalid Todo ${updateColumn}`);
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
        response.send(`Invalid Todo ${updateColumn}`);
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
        response.send(`Invalid Todo ${updateColumn}`);
      }
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";

      const { dueDate } = request.body;
      const result = isValid(new Date(dueDate));

      if (result) {
        updateTodoQuery = `
    UPDATE
      todo
    SET
      due_date='${format(new Date(dueDate), "yyyy-MM-dd")}'
    WHERE
      id = ${todoId};`;
        await database.run(updateTodoQuery);
        response.send(`${updateColumn} Updated`);
      } else {
        response.status(400);
        response.send(`Invalid ${updateColumn}`);
      }
      break;
  }
});

app.get("/agenda/", async (request, response) => {
  const { date = "" } = request.query;
  let kDate = format(new Date(date), "yyyy-MM-dd");
  const result3 = isValid(new Date(kDate));

  if (result3) {
    const getAPI3Query = `
    SELECT 
      *
    FROM 
      todo 
    WHERE 
    due_date = ${kDate};`;
    const result3 = await database.get(getAPI3Query);
    const updatedData3 = result3.map((each) => convertResponseObject(each));
    response.send(updatedData3);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

module.exports = app;
