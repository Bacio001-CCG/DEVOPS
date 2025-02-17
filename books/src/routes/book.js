import express from "express";
import { db } from "../database.js";
const router = express.Router();

router.get(
  "/",
  async function (req, res){
    try {
      let list = [];

      // Check of er een query parameter is meegegeven en filter op basis daarvan
      if (req.query.title) {
        list = await db
          .collection("books")
          .find({ title: req.query.title }).toArray();
      } else if (req.query.id) {
        list = await db
          .collection("books")
          .find({ bookId: req.query.id }).toArray();
      } else {
        list = await db.collection("books").find().toArray();
      }
      if(list.length === 0) {
        return res.status(404).json("Geen boeken gevonden");
      }
      return res.status(200).json(list);
    } catch (err) {
      return res
        .status(500)
        .json({ message: err?.message ?? "Internal Server Error" });
    }
  }
);

router.post(
  "/",
  async function (req, res) {
    try {
      const book = {
        bookId: Math.random().toString(36),
        title: req.query.title,
        shortDescription: req.query.shortDescription,
        description: req.query.description,
        author: req.query.author,
      };

      // Check of alle velden zijn aangeleverd
      for (let key in book) {
        if (!book[key]) {
          return res
            .status(400)
            .json(`${key} is niet aangeleverd`);
        }
      }

      await db.collection("books").insertOne(book);

      return res.status(200).json("Boek aangemaakt");
    } catch (err) {
      return res
        .status(500)
        .json(err?.message ?? "Internal Server Error");
    }
  }
);

export default router;
