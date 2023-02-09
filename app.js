const express = require("express")
const bodyParser = require("body-parser")
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);
const _ = require("lodash")


const app = express()

app.use(bodyParser.urlencoded({extended:true}));

app.set("view engine", 'ejs')

app.use(express.static("public"))

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb+srv://admin-jattin:9h-5tGNPJN!Xec8@cluster0.xje4xs2.mongodb.net/todoListDB');
  }


const itemsSchema = new mongoose.Schema({
    name: String
})

const Item = new mongoose.model("Item", itemsSchema)


const defaultItems = [
    {name: "Welcome to your todolist!"},
    {name: "Hit the + button to add a new item."},
    {name: "<-- Hit this to delete an item."}
]

const listsSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
})

const List = new mongoose.model("List", listsSchema)

app.get("/", (req,res)=>{
    Item.find({}, (err, foundItems)=>{
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, err=>{
                if(err){
                    console.log(err)
                }
                else{
                    console.log("Successfully added to the DB")
                }
            })
            res.redirect("/")
        }
        else{
        res.render("list", {listTitle: "Today", newItems : foundItems})
        }
    })
})


app.get("/:customListName", (req,res)=>{
    const customlistName = _.capitalize(req.params.customListName)
    
    List.findOne({name : customlistName}, (err,foundList)=>{
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customlistName,
                    items: defaultItems
                });
                list.save()
              res.redirect("/" + customlistName)  
            }
            else{
                res.render("list", {listTitle: foundList.name, newItems: foundList.items})
            }
        }
    })
})


app.post("/", (req,res) => {
    const itemName = req.body.newItem
    const listName = req.body.list

    const item = new Item({
        name: itemName
    })
    if (listName === "Today") {
        
        item.save();
        res.redirect("/")
    }
    else{
        List.findOne({name: listName}, (err, foundList)=>{
            if(!err){
            foundList.items.push(item)
            foundList.save()
            res.redirect("/"+ listName)
            }
        })
    }

})

app.post("/delete", (req,res)=>{
    const checkedItem = req.body.checkbox
    const listName = req.body.listName

    if (listName === "Today") {
        
            Item.findByIdAndRemove(checkedItem, err=>{
                if(err){
                    console.log(err)
                }
                else{
                    console.log("Successfully deleted the item from the todolistDB")
                }
            })
            res.redirect("/")
        
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}}, (err,foundList)=>{
            if(!err){
                res.redirect("/"+ listName)
            }
        })
    }
})

const port = 3000 || process.env.PORT
app.listen(port, ()=>{
    console.log("Server started on port "+ port)
})
