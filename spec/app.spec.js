process.env.NODE_ENV = 'test'
const request = require("supertest");
const app = require("../server/app");
const connection = require("../server/connection");

beforeEach(()=> connection.migrate.rollback())
beforeEach(()=> connection.migrate.latest())
beforeEach(()=> connection.seed.run())

describe("/TESTING", () => {
  // BASELINE TESTING

  afterAll(() => {
    return connection.destroy();
  });

describe('/api', () => {

  test("200 should return that the base route endpoint is working", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body }) => {
        expect(body.msg).toEqual("api is up and running ok");
      });
  });

  // API ERRORS

  test('404 - when incorrect route is specified, returns 404 and incorrect message', () => {
    return request(app)
    .get('/wrongURL')
    .expect(404)
    .then((respond)=> {
        expect(respond.body.msg).toEqual('resource not found');
    })
});

});

  // TOPICS TESTING

  describe("/topics", () => {
    test("200 should return an array of all the topics", () => {
      return request(app)
        .get("/api/topics")
        .expect(200)
        .then(({ body }) => {
          expect(Array.isArray(body.topics)).toEqual(true);
          body.topics.forEach((topic) => {
            expect(topic).toHaveProperty("slug");
            expect(topic).toHaveProperty("description");
          });
        });
    });

    // TOPICS ERROR TESTING

    test('404 - when incorrect route is specified, returns 404 and incorrect message', () => {
      return request(app)
      .get('/api/wrongURL')
      .expect(404)
      .then((respond)=> {
          expect(respond.body.msg).toEqual('resource not found');
      })
  });


  });


  // USERS TESTING

  describe("/users", () => {

    test("200 should return with a specific user", () => {
      return request(app)
        .get("/api/users/butter_bridge")
        .expect(200)
        .then(({ body }) => {
          expect(Array.isArray(body.users)).toBe(true);
          expect(body.users[0].username).toBe("butter_bridge");
          expect(body.users[0].avatar_url).toBe(
            "https://www.healthytherapies.com/wp-content/uploads/2016/06/Lime3.jpg"
          );
          expect(body.users[0].name).toBe("jonny");
        });
    });

    // USER ERROR TESTING

    test('404 - when incorrect route is specified, returns 404 and incorrect message', () => {
      return request(app)
      .get('/api/users/not-a-user')
      .expect(404)
      .then((respond)=> {
          expect(respond.body.msg).toEqual('user not found');
      })
  });

  });

  // ARTICLE TESTING

  describe("/articles", () => {
    test("GET 200 should return with a article by user id", () => {
      return request(app)
        .get("/api/article/1")
        .expect(200)
        .then(({ body }) => {
          // more simple response
          expect(Array.isArray(body.article)).toBe(true);
          expect(body.article[0].article_id).toBe(1);
          expect(body.article[0].title).toBe(
            "Living in the shadow of a great man"
          );
          expect(body.article[0].body).toBe(
            "I find this existence challenging"
          );
          expect(body.article[0].votes).toBe(100);
          expect(body.article[0].topic).toBe("mitch");
          expect(body.article[0].author).toBe("butter_bridge");
          expect(body.article[0].comment_count).toBe("13");
        });
    });

    // ARTICLE ERROR TESTING - GET ARTICLE BY ID

    test('404 - when incorrect route is specified, returns 404 and incorrect message', () => {
      return request(app)
      .get("/api/article/5000")
      .expect(404)
      .then((respond)=> {
          expect(respond.body.msg).toEqual('article not found');
      })
  });

  // patch article by id

  test("PATCH 200 patch article votes by article id (increase)", () => {
    return request(app)
      .patch("/api/article/1")
      .send({ inc_votes: 50 })
      .expect(200)
      .then(({ body }) => {
        expect(Array.isArray(body.article)).toBe(true);
        expect(body.article[0].votes).toBe(150);
      });
  });

  test("PATCH 200 patch article votes by article id(decrease)", () => {
    return request(app)
      .patch("/api/article/1")
      .send({ inc_votes: -50 })
      .expect(200)
      .then(({ body }) => {
        expect(Array.isArray(body.article)).toBe(true);
        expect(body.article[0].votes).toBe(50);
      });
  });


  // ARTICLE ERROR TESTING - PATCH ARTICLE BY ID

    test('404 - when incorrect route is specified, returns 404 and incorrect message', () => {
      return request(app)
      .patch("/api/article/5000")
      .expect(404)
      .then((respond)=> {
          expect(respond.body.msg).toEqual('article not found');
      })
  });

  // post comment to article by article ID

  test("POST 201 Adds a new comment to an article by article id", () => {
    return request(app)
      .post("/api/article/1/comments")
      .send({
        username: "butter_bridge",
        body: "this really was a great read for sure",
      })
      .expect(201)
      .then(({ body }) => {
        expect(Array.isArray(body.comment)).toBe(true);
        const { comment } = body;
        expect(comment[0].comment_id).toBe(19);
        expect(comment[0].author).toBe("butter_bridge");
        expect(comment[0].article_id).toBe(1);
        expect(comment[0].votes).toBe(0);
        expect(comment[0].created_at).not.toBe("Invalid Date");
        expect(comment[0].body).toBe("this really was a great read for sure");
      });
  });

  // get comments by article id

  test("GET 200 Get all the available comments by its id", () => {
    return request(app)
      .get("/api/article/9/comments")
      .expect(200)
      .then(({ body }) => {
        expect(Array.isArray(body.comments)).toBe(true);
        body.comments.forEach((comment) => {
          expect(comment).toHaveProperty("comment_id");
          expect(comment).toHaveProperty("author");
          expect(comment).toHaveProperty("votes");
          expect(comment).toHaveProperty("body");
          expect(comment).toHaveProperty("created_at");
        });
      });
  });

  // get comments by article id & sort by deafult (created_at)

  test("GET 200 responds with an array of all the articles comments sorted by created at (newest first)", () => {
    return request(app)
      .get("/api/article/1/comments")
      .expect(200)
      .then(({ body }) => {
        expect(Array.isArray(body.comments)).toBe(true);
        expect(body.comments).toBeSortedBy("created_at", {
          descending: true,
          //  coerce: true
        });
      });
  });

  // get comments by article id & SORT BY A VALID ASC/DESC QUERY

  test("GET 200 responds with an array of all the articles comments sorted by a valid query ASC/DESC", () => {
    return request(app)
      .get("/api/article/1/comments?order=asc")
      .expect(200)
      .then(({ body }) => {
        expect(Array.isArray(body.comments)).toBe(true);
        expect(body.comments).toBeSortedBy("created_at", {
          descending: false,
          //  coerce: true
        });
      });
  });

  // Add a sort_by new valid column 

  // get all articles

  test("GET 200 responds with an array of all the articles", () => {
    return request(app)
      .get("/api/article")
      .expect(200)
      .then(({ body }) => {
        expect(Array.isArray(body.articles)).toBe(true);
        body.articles.forEach((article) => {
          expect(article).toHaveProperty("author");
          expect(article).toHaveProperty("title");
          expect(article).toHaveProperty("article_id");
          expect(article).toHaveProperty("topic");
          expect(article).toHaveProperty("created_at");
          expect(article).toHaveProperty("votes");
          expect(article).toHaveProperty("comment_count");
        });
      });
  });

  // Defaults sort-by articles to DATE in ascending order

  test("GET 200 responds with an array of all the articles sorted by a default (DATE)", () => {
    return request(app)
      .get("/api/article")
      .expect(200)
      .then(({ body }) => {
        expect(Array.isArray(body.articles)).toBe(true);
        expect(body.articles).toBeSortedBy("created_at", {
          descending: true,
          //  coerce: true
        });
      });
  });

  // change the default sort by to ascending

  test("GET 200 should switch up the order to asc based on the query", () => {
    return request(app)
      .get("/api/article?order=asc")
      .expect(200)
      .then(({ body }) => {
        expect(Array.isArray(body.articles)).toBe(true);
        expect(body.articles).toBeSortedBy("created_at", {
          descending: false,
          //  coerce: true
        });
      });
  });

    // change the sort by to sort by a viable column

    test("GET 200 should change up the order sort by, with a viable column", () => {
      return request(app)
        .get("/api/article?sort_by=comment_count")
        .expect(200)
        .then(({ body }) => {
          expect(Array.isArray(body.articles)).toBe(true);
          expect(body.articles).toBeSortedBy("comment_count", {
            descending: true,
             coerce: true
          });
        });
    });


    // Filter the array by a specific username

      test("GET 200 filter the article by a specific username (butter_bridge)", () => {
      return request(app)
        .get("/api/article?username=butter_bridge")
        .expect(200)
        .then(({ body }) => {
          expect(Array.isArray(body.articles)).toBe(true);
          body.articles.forEach((article) => {
            expect(article.author).toEqual('butter_bridge');
          })
        });
    });

    test("GET 200 filter the article by a specific username (icellusedkars)", () => {
      return request(app)
        .get("/api/article?username=icellusedkars")
        .expect(200)
        .then(({ body }) => {
          expect(Array.isArray(body.articles)).toBe(true);
          body.articles.forEach((article) => {
            expect(article.author).toEqual('icellusedkars');
          })
        });
    });

    // Filter the array by a specific topic

    test("GET 200 filter the article by a specific topic (mitch)", () => {
      return request(app)
        .get("/api/article?topic=mitch")
        .expect(200)
        .then(({ body }) => {
          expect(Array.isArray(body.articles)).toBe(true);
          body.articles.forEach((article) => {
            expect(article.topic).toEqual('mitch');
          })
        });
    });

    test("GET 200 filter the article by a specific topic (cats)", () => {
      return request(app)
        .get("/api/article?topic=cats")
        .expect(200)
        .then(({ body }) => {
          expect(Array.isArray(body.articles)).toBe(true);
          body.articles.forEach((article) => {
            expect(article.topic).toEqual('cats');
          })
        });
    });

  });

    // COMMENTS TESTS

    // Patch existing comments with an updated (increased/decreased) vote count

    describe('/Comments', () => {
      
    test("PATCH 200 patch increase comment votes by comment id", () => {
      return request(app)
        .patch("/api/comments/3")
        .send({ inc_votes: 50 })
        .expect(200)
        .then(({ body }) => {
          expect(Array.isArray(body.comment)).toBe(true);
          expect(body.comment[0].votes).toBe(150);
        });
    });

    test("PATCH 200 patch decrease comment votes by comment id", () => {
      return request(app)
        .patch("/api/comments/3")
        .send({ inc_votes: -50 })
        .expect(200)
        .then(({ body }) => {
          expect(Array.isArray(body.comment)).toBe(true);
          expect(body.comment[0].votes).toBe(50);
        });
    });

  });
});
