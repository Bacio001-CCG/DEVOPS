import express from "express";
import { db } from "../database.js";
const router = express.Router();
import axios from "axios";

router.get(
  "/",
  async function (req, res){
    try {
      let list = [];

      // Check of er een query parameter is meegegeven en filter op basis daarvan
      if (req.query.title) {
        list = await db
          .collection("members")
          .find({ name: req.query.name }).toArray();
      } else {
        list = await db.collection("members").find().toArray();
      }
      console.log("test2");
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
      const member = {
        memberId: Math.random().toString(36),
        name: req.query.name,
        age: req.query.age,
      };

      // Check of alle velden zijn aangeleverd
      for (let key in member) {
        if (!member[key]) {
          return res
            .status(400)
            .json(`${key} is niet aangeleverd`);
        }
      }

      await db.collection("members").insertOne(member);

      return res.status(200).json("Lid aangemaakt");
    } catch (err) {
      return res
        .status(500)
        .json(err?.message ?? "Internal Server Error");
    }
  }
);

router.post(
  "/favorite",
  async function (req, res) {
    try {
      const favorite = {
        name: req.query.name,
        title: req.query.title,
      };

      // Check of alle velden zijn aangeleverd
      for (let key in favorite) {
        if (!favorite[key]) {
          return res
            .status(400)
            .json(`${key} is niet aangeleverd`);
        }
      }

      const book = await axios.get(`${process.env.BOOK_SERVICE_URL}?title=${req.query.title}`);

      const bookId = book.data[0].bookId;
      const member = await db.collection("members").find({ name: req.query.name }).toArray()

      if(member.length === 0) {
        return res.status(404).json("Geen lid gevonden met deze naam");
      }

      const memberId = member[0].memberId;
      await db.collection("favorites").insertOne({
        bookId,
        memberId
      });
      return res.status(200).json("Favoriete aangemaakt");

    } catch (err) {
      if(err.response.status === 404) {
        return res.status(404).json("Boek niet gevonden");
      }
      return res
        .status(500)
        .json(err?.message ?? "Internal Server Error");
    }
  }
);

router.get(
  "/favorites",
  async function (req, res) {
    try {
      const favorite = {
        name: req.query.name,
      };

      // Check of alle velden zijn aangeleverd
      for (let key in favorite) {
        if (!favorite[key]) {
          return res
            .status(400)
            .json(`${key} is niet aangeleverd`);
        }
      }

      const member = await db.collection("members").find({ name: req.query.name }).toArray();

      if(member.length === 0) {
        return res.status(404).json("Geen lid gevonden met deze naam");
      }

      const memberId = member[0].memberId;

      const favorites = await db.collection("favorites").find({ memberId }).toArray();
      
      if(favorites.length === 0) {
        return res.status(404).json("Geen favorieten gevonden voor dit lid");
      }

      const reservedBooks = [];

      for(const favorite of favorites){
        try {
          const book = await axios.get(`${
            process.env.BOOK_SERVICE_URL
          }?id=${favorite.bookId}`);

          reservedBooks.push(book.data[0]);
        } catch(err) {
          if(err.response.status === 404) {
            return res.status(404).json("Boek niet gevonden");
          }
          return res
            .status(500)
            .json(err?.message ?? "Internal Server Error");
        }
      }

      return res.status(200).json(reservedBooks);

    } catch (err) {
      return res
        .status(500)
        .json(err?.message ?? "Internal Server Error");
    }
  }
);
export default router;
