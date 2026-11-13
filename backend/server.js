const http=require('http');
const {MongoClient,ojectId, ObjectId}=require('mongodb');

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

    //Update student
        else if(req.url.startsWith("/updateStudent/") && req.method==="PUT"){
            const id=req.url.split("/")[2];
            if(!ObjectId.isValid(id)){
                res.statusCode=400;
                res.end(JSON.stringify({
                    message:"Invalid student ID"
                }),
            );
            return;
        }
        let body="";
        req.on("data",(chunk)=>{
            body+=chunk.toString();
        });
        req.on("end",async()=>{
            try{
                const updateData=JSON.parse(body);
                const updateStudent={
                    name:updateData.name,
                    age:Number(updateData.age),
                    course:updateData.course,
                };

                const result=await studentsCollection.updateOne(
                    {
                        _id:new ObjectId(id)
                    },
                    {
                        $set:updateStudent,
                    },
                );
                if(result.matchedCount===0){
                    res.statusCode=404;
                    res.end(JSON.stringify({
                        message:"Student not found",
                    }),
                );
                return;
                }

        //Get updated student

                const student=await studentsCollection.findOne({
                    _id:new ObjectId(id),
                });

                res.statusCode=200;
                res.end(JSON.stringify({
                    message:"Student data updated successfully",
                    student:student,
                }),
                );
            }catch(error){
                console.log(error);
                res.statusCode=500;
                res.end(JSON.stringify({
                    message:"Failed to update student",
                    }),
                );
                
            }
        });
    }


    //get student by id
        else if(req.url.startsWith('/getStudent/') && req.method==="GET"){
            try{
                const id=req.url.split('/')[2];
                if(!ObjectId.isValid(id)){
                res.statusCode=400;
                res.end(JSON.stringify({
                    message:"Invalid Id"
                }))
                return;
            }

            const student=await studentsCollection.findOne({
                _id:new ObjectId(id)
            });

            if(!student){
                res.statusCode=404;
                res.end(JSON.stringify({
                    message:"Student Not found"
                }))
                return;
            }

            res.statusCode=200;
            res.end(JSON.stringify({
                message:"Student Found",
                student:student
            }))

            }catch(error){
            console.log(error);
            res.statusCode=500;
            res.end(JSON.stringify({
                message:"Failed to fetch student"
            }))
            
        }
    }



        //Delete a student
        else if(req.url.startsWith('/deleteStudent/') && req.method==="DELETE"){
            try{
                const id=req.url.split('/')[2];
                if(!ObjectId.isValid(id)){
                    res.statusCode=400;
                    res.end(JSON.stringify({
                        message:"Invalid student ID"
                    }));
                    return;
                }
                const student=studentsCollection.findOne({
                    _id:new ObjectId(id)
                });
                if(!student){
                    res.statusCode=404;
                    res.end(JSON.stringify({
                        message:"Student Not Found"
                    }))
                    return;
                }

                await studentsCollection.deleteOne({
                    _id:new ObjectId(id)
                });
                req.statusCode=200;
                res.end(JSON.stringify({
                    message:"Student details deleted successfully",
                    student:student
                }))
            }catch(error){
                console.log(error);
                res.statusCode=500;
                res.end(JSON.stringify({
                    message:"Failed to delete student"
                }))
            }
        }

        //Invalid route
        else{
            res.statusCode=404;
            res.end(JSON.stringify({
                message:"Route Not Found"
            }))
        }
    
});


server.listen(3000,()=>{
    console.log("Server running at http://localhost:3000");
})