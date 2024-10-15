import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/User";
import bcrypt from 'bcrypt'

export async function POST(request: Request){
    await dbConnect()

    try {
        const {email, username, password} = await request.json()

        const existingVerifiedUserByUsername = await UserModel.find({
            username: username,
            isVerified: true
        })

        console.log(existingVerifiedUserByUsername);
        

        if (existingVerifiedUserByUsername.length > 0) {
            return Response.json(
                {
                    success: false,
                    message: "User already exists"
                },
                {
                    status: 400
                }
            )
        }

        const existingUserByEmail = await UserModel.findOne({email})

        let verifyCode = Math.floor(100000 + Math.random()*900000).toString()

        if (existingUserByEmail) {
            if (existingUserByEmail.isVerified) {
                return Response.json(
                    {
                        success: false,
                        message: "User already exists with this email"
                    },
                    {
                        status: 400
                    }
                )
            } else {
                existingUserByEmail.password = await bcrypt.hash(password, 10)
                existingUserByEmail.verifyCode = verifyCode,
                existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000)
                await existingUserByEmail.save()
            }
        } else {
           const hashedPassword = await bcrypt.hash(password, 10)
           const expiryDate = new Date()
           expiryDate.setHours(expiryDate.getHours() + 1)

           const newUser = new UserModel({
            username,
            email,
            password: hashedPassword,
            verifyCode,
            verifyCodeExpiry: expiryDate,
            isVerified: false,
            isAcceptingMessage: true,
            messages: []
           })

           await newUser.save()
        }

        
    //Sending verification email

    const emailResponse = await sendVerificationEmail(
        email,
        username,
        verifyCode
    );

    if(!emailResponse.success){
        return Response.json(
            {
                success: false,
                message: emailResponse.message
            },
            {
                status: 500
            }
        )
    }

    return Response.json(
        {
            success: true,
            message: "User registered successfully. Please verify your account"
        },
        {
            status: 201
        }
    )


    } catch (error) {
        console.error("Error registering user: ", error)
        return Response.json(
            {
                success: false,
                message: "Error registering user"
            },
            {
                status: 500
            }
        )
    }
}