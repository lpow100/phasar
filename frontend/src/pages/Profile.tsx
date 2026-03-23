import { useState, useEffect, type MouseEventHandler } from "react";
import { useSearchParams } from "react-router-dom";
import pencil from "../assets/edit_pencil.png";
import './Profile.css';
import { getCookieValue } from "../../../cookie-funcs";
import axios from 'axios';

export default function Profile() {
    // Start with a leading slash for public folder access
    const [imagePath, setImagePath] = useState("/user_images/profile_pictures/defaultPfp.jpg");
    const [searchParams] = useSearchParams();
    const [shouldShowPopup, setShowPopup] = useState(false);
    const [uploadPfpFile, setUploadPfpFile] = useState<File|null>(null);
    
    const urlUserId = parseInt(searchParams.get('user-id') || '0');

    // Helper to fetch username
    const getUsersName = async (id: number): Promise<string> => {
        if (id === 4) return "Anonymous";
        if (!id) return "";

        try {
            const response = await fetch(`http://localhost:3000/get-user-info/${id}`);
            if (!response.ok) return "Error!";
            const json = await response.json();
            return json.username.username || "Invalid User!";
        } catch (err) {
            console.error("Network failed:", err);
            return "Connection Error";
        }
    }

    // Sub-component for the name to avoid re-rendering the whole profile
    const UserName = ({ userId }: { userId: number }) => {
        const [name, setName] = useState("...");
        useEffect(() => {
            getUsersName(userId).then(setName);
        }, [userId]);
        return <span>{name}</span>;
    };


    useEffect(() => {
        setImagePath(`http://localhost:3000/user-pfp/${urlUserId}`)
    }, [urlUserId]);

    const HandleChooseToEdit = () => {
        setShowPopup(true);
    }

    const HandleStopEdit = () => {
        setShowPopup(false);
    }

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const files = e.target.files;
        if (!files) return;
        setUploadPfpFile(files.item(0));
    }

    const uploadFile = async () => {
        if (!uploadPfpFile) return alert("Please select a file first");

        const formData = new FormData();

        formData.append('image', uploadPfpFile);

        // 3. (Optional) Add extra text data
        formData.append('session_id', getCookieValue('RigelSessionID'));

        try {
        await axios.post('http://localhost:3000/upload_pfp', formData, {
            headers: {
            'Content-Type': 'multipart/form-data', // Usually handled automatically by Axios/Fetch
            },
        });
        alert("Upload successful!");
        } catch (err) {
        console.error("Upload failed", err);
        }
    }

    const PfpChangePopup = ({shouldShow}: {shouldShow: boolean}) => {
        if (shouldShow)
            return (
                <div className="centered-element">
                    <div className="popup-header">
                        <strong>Edit Profile Picture</strong>
                        <strong className="close-button" onClick={HandleStopEdit}>X</strong>
                    </div>
                    <img 
                        src={imagePath} 
                        alt="Profile" 
                        className="img-preview" 
                        onError={(e) => {
                            // Fallback if the specific user image is missing in public folder
                            e.currentTarget.src = "/user_images/profile_pictures/defaultPfp.jpg";
                        }}
                    />
                    <hr/>
                    <label>Choose new profile picture file</label>
                    <br/>
                    <input type='file' onChange={handleFileSelected}/>
                    <br/><br/>
                    <button onClick={uploadFile}>Set new profile picture</button>
                </div>
            );
        else return <></>;
    }

    return (
        <>
            <h1><UserName userId={urlUserId}/></h1>

            <div className="component-wrapper">
                {/* Layer 1: The Cropped Image */}
                <div className="circle-cropper">
                    <img 
                        src={imagePath} 
                        alt="Profile" 
                        className="base-img" 
                        onError={(e) => {
                            // Fallback if the specific user image is missing in public folder
                            e.currentTarget.src = "/user_images/profile_pictures/defaultPfp.jpg";
                        }}
                    />
                </div>

                {/* Layer 2: The Gradient (aligned to the pencil) */}
                <div className="gradient-overlay"></div>

                {/* Layer 3: The Pencil Icon */}
                <img src={pencil} className="pencil-icon" alt="Edit" onClick={HandleChooseToEdit}/>
                
                {/* Layer 4: Centered Text (Optional based on your previous snippet) */}
                <PfpChangePopup shouldShow={shouldShowPopup}/>
            </div>
        </>
    )
}