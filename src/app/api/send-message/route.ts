import dbConnect from "@/lib/dbConnect";
import UserModel, { Message } from "@/model/User";

export async function POST(request: Request){

    await dbConnect()

    const { username, content } = await request.json()

    try {
         const foundUser = await UserModel.findOne({ username: username })

         if (!foundUser) {
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

         if (!foundUser.isAcceptingMessage) {
            return Response.json(
                {
                    success: false,
                    message: "User is not accepting messages"
                },
                {
                    status: 403
                }
            )
         }

         const newMessage = {
            content: content,
            createdAt: new Date()
         }

         foundUser.message.push(newMessage as Message)
         await foundUser.save()

         return Response.json(
            {
                success: true,
                message: "Message sent successfully"
            },
            {
                status: 200
            }
        )
    } catch (error) {
        console.error("Internal Server Error ", error)
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