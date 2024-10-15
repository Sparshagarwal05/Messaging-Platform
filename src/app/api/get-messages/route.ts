import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { User } from "next-auth";
import mongoose from "mongoose";

export async function GET(request: Request){

    await dbConnect()

    const session = await getServerSession(authOptions)
    const user: User = session?.user

    if (!session || !user) {
        return Response.json(
            {
                success: false,
                message: "Not authenticated"
            },
            {
                status: 401
            }
        )
    }

    const userId = user._id

    try {
        
        const foundUser = await UserModel.aggregate(
            [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(userId)
                    }
                },
                {
                    $unwind: "$message"
                },
                {
                    $sort: {
                        'message.createdAt': -1
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        messages: {
                            $push: "$message"
                        } 
                    }
                }
            ]
        )

        if (!foundUser || foundUser.length === 0) {
            return Response.json(
                {
                    success: false,
                    message: "User not found"
                },
                {
                    status: 404
                }
            )
        }

        return Response.json(
            {
                success: true,
                messages: foundUser[0].messages
            },
            {
                status: 200
            }
        )

    } catch (error) {
        console.error("An unexpected error occured: ",error)
        return Response.json(
            {
                success: false,
                message: "Internal Server Error"
            },
            {
                status: 500
            }
        )
    }
}