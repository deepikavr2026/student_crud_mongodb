const http=require('http');
const {MongoClient,ojectId}=require('mongodb');

//Mongodb connection

const mongoURL="mongodb://127.0.0.1:27017"
const client=new MongoClient(mongoURL);
let studentsCollection;

async function connectDB(){
    try{
        await client.connect();
        console.log("Mongodb connected successfully");
        const database=client.db("studentDB");
        studentsCollection=database.collection("students");
    }catch(error){
        console.log("Mongodb connection error:",error);
        
    }
}

connectDB();

const server=http.createServer(async(req,res)=>{
    //response header
    res.setHeader("content-type","application/json");

    //get all students

    if(req.url==='/getStudents' && req.method==="GET"){
        try{
        const students=await studentsCollection.find().toArray();
        res.statusCode=200;
        res.end(JSON.stringify({
            message:"Students details fetched successfully",
            students:students
        }))

        }catch(error){
            console.log(error);
            res.statusCode=500;
            res.end(JSON.stringify({
                message:"Fetched failed"
            }));
            
        }
    }

    //Post students
    else if(req.url==='/addStudent' && req.method==="POST"){
        let body="";
        req.on("data",(chunk)=>{
            body+=chunk.toString();
        });
        req.on("end",async()=>{
            try{
                const newStudent=JSON.parse(body);
                const student={
                    name:newStudent.name,
                    age:Number(newStudent.age),
                    course:newStudent.course
                }

                const result=await studentsCollection.insertOne(student);
                res.statusCode=201;
                res.end(JSON.stringify({
                    message:"Student data added successfully",
                    student:{
                        _id:result.insertedId,
                        ...student
                    }
                }))

            }catch(error){
                console.log(error);
                res.statusCode=500;
                res.end(JSON.stringify({
                    message:"Failed to add student"
                }))
                
            }
        })
    }
});

server.listen(3000,()=>{
    console.log("Server running at http://localhost:3000");
})