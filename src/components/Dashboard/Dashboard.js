import React, { useEffect, useState, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import DOMPurify from "dompurify";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { useDropzone } from "react-dropzone";
import axios from 'axios';
import { saveAs } from 'file-saver';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("purpose");
  const [formData, setFormData] = useState({});

  // const handleTabClick = (tab) => {
  //   setActiveTab(tab);
  // };

  const handlePurposeNext = (data) => {
    setFormData({ ...formData, ...data });
    setActiveTab("title");
  };

  const handleTitleNext = (data) => {
    setFormData({ ...formData, ...data });
    setActiveTab("outline");
  };

  const handleOutlineNext = (data) => {
    setFormData({ ...formData, ...data });
    setActiveTab("generate");
  };

  async function chatgpt(prompt) {
    const DEFAULT_PARAMS = {
      model: "gpt-3.5-turbo-1106",
      messages: [
        {
          role: "system",
          content:
            "You are ChatGPT, a large language model trained by OpenAI. Act as brochure creator",
        },
        { role: "user", content: prompt },
      ],
    };

    const params = { ...DEFAULT_PARAMS };
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + String(process.env.REACT_APP_OPEN_AI_KEY),
      },
      body: JSON.stringify(params),
    };
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      requestOptions
    );
    const data = await response.json();
    const result = data.choices[0].message.content;
    return result;
  }

  const PurposeContent = ({ data, onNext }) => {
    const [loading, setLoading] = useState(false);

    const [brochureTitle, setBrochureTitle] = useState(
      data.brochureTitle || ""
    );
    const [image, setImage] = useState(data.image || "");
    // const [imagePreview, setImagePreview] = useState(null);

    const [errors, setErrors] = useState({
      brochureTitle: false,
      image: false,
    });

    const onDrop = useCallback((acceptedFiles) => {
      // Assuming you want to select the first file from the dropped files
      const firstFile = acceptedFiles[0];
      console.log(firstFile);
      if (firstFile) {
        setImage(firstFile); // Set the image path in the state
        setErrors({ ...errors, image: false });
      }
    }, []);

    const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
      useDropzone({ onDrop });

    const files = acceptedFiles.map((file) => (
      <>
        <li className="imageLi" key={file.path}>
          <img
            src={URL.createObjectURL(file)} // Use URL.createObjectURL to create a temporary URL for the image
            alt="Uploaded"
            style={{ maxWidth: "64px", maxHeight: "64px" }} // Adjust the styling as needed
          />
          {file.path} - {Math.round(file.size / 1000)} kB
        </li>
      </>
    ));

    const createAndDownloadPdf = () => {
      const state = {
        name: 'Sudfiyan',
        receiptId: 0,
        price1: 0,
        price2: 0,
      }
    
      axios.post('https://pdf-5sg8.onrender.com/create-pdf', state)
        .then(() => axios.get('https://pdf-5sg8.onrender.com/fetch-pdf', { responseType: 'blob' }))
        .then((res) => {
          const pdfBlob = new Blob([res.data], { type: 'application/pdf' });
  
          saveAs(pdfBlob, 'newPdf.pdf');
        })
    }

    const handleFirstStepNext = async () => {
      // Check if either the brochureTitle or image is empty
      if (!brochureTitle || acceptedFiles.length === 0) {
        console.log("Validation error");
        setErrors({
          brochureTitle: !brochureTitle,
          image: acceptedFiles.length === 0,
        });
      } else {
        // Both fields have values, proceed with the rest of the logic
        setErrors({ brochureTitle: false, image: false });

        try {
          const handleChatgpt = async () => {
            setLoading(true);

            const prompt = `Generate 3 paragraphs brochure description for below Brochure Title which is: ${brochureTitle}`;
            const output = await chatgpt(prompt);
            // const output = "hii";
            setLoading(false);

            console.log(output);
            onNext({
              brochureTitle,
              image,
              output,
            });
          };

          handleChatgpt();
        } catch (error) {
          console.error("Step1 failed", error);
        }
      }
    };

    // const handleFirstStepNext = async () => {
    //   if (acceptedFiles.length == 0) {
    //     console.log("q")
    //     setErrors({ ...errors, image: true });
    //   }

    //   let formIsValid = true;
    //   const requiredFields = {
    //     brochureTitle,
    //     image,
    //   };
    //   const newErrors = { ...errors };

    //   Object.keys(requiredFields).forEach((field) => {
    //     if (!requiredFields[field]) {
    //       formIsValid = false;
    //       newErrors[field] = true;
    //     } else {
    //       newErrors[field] = false;
    //     }
    //   });

    //   setErrors(newErrors);

    //   if (formIsValid) {
    //     try {
    //       const handleChatgpt = async () => {
    //         setLoading(true); // Set loading to true when starting content generation

    //         const prompt = `Generate 3 paragraphs brochure description for below Brochure Title which is: ${brochureTitle}
    //   `;

    //         console.log(prompt);

    //         const output = await chatgpt(prompt);

    //         setLoading(false); // Set loading to false when content generation is complete

    //         console.log(output);
    //         onNext({
    //           brochureTitle,
    //           image,
    //           output,
    //         });
    //       };

    //       handleChatgpt();
    //     } catch (error) {
    //       console.error("Step1 failed", error);
    //     }
    //   }
    // };

    return (
      <div className="space-y-4">
            <button onClick={createAndDownloadPdf}>Download PDF</button>
        <div>
          <label className="text-gray-600 font-semibold block mb-2">
            Brochure Title*{" "}
            {errors.brochureTitle && (
              <small className="text-red-500">* Required</small>
            )}
          </label>
          <input
            value={brochureTitle}
            onChange={(e) => {
              setBrochureTitle(e.target.value);
              setErrors({ ...errors, brochureTitle: false });
            }}
            className={`border ${
              errors.brochureTitle ? "border-red-500" : "border-gray-300"
            } rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline`}
            id="brochureTitle"
            type="text"
            placeholder="Describe the title of your brochure"
          />
        </div>

        <div className="w-full">
          <label className="text-gray-600 font-semibold block mb-2">
            Brochure Image*{" "}
            {errors.image && <small className="text-red-500">* Required</small>}
          </label>
          <div
            class={`dropzone flex flex-col items-center justify-center w-full h-64 border-2 ${
              errors.image ? "border-red-500" : "border-gray-300"
            } border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600`}
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="px-2 text-center">Drop the files here ...</p>
            ) : (
              <p className="px-2 text-center">
                Drag 'n' drop some files here, or click to select files
              </p>
            )}
          </div>
          <aside>
            <br />
            <h4>Image</h4>
            <ul>{files}</ul>
          </aside>
        </div>

        <div className="flex justify-end">
          <button
            className="bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 hover:bg-gradient-to-r hover:from-indigo-500 hover:via-purple-400 hover:to-pink-400 text-white px-4 py-2 rounded-md text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            disabled={loading}
            onClick={handleFirstStepNext}
          >
            <div className="flex items-center">
              {!loading && (
                <span className="mr-2">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                </span>
              )}
              {loading ? (
                <>
                  <span>Generating</span>
                  <div className="loader ease-linear border border-t-2 border-white-500 border-white h-4 w-4 ml-2 animate-spin rounded-full"></div>
                </>
              ) : (
                <span>Generate with AI</span>
              )}
            </div>
          </button>
        </div>
      </div>
    );
  };

  const BlogTitle = ({ data, onNext }) => {
    return (
      <>
        <h1 className="text-center text-xl font-semibold text-gray-800 mb-6">
          Brochure
        </h1>
        <div className="flex">
          {/* Left Section for Image */}
          <div className="w-2/5 p-4">
            <img
              src={URL.createObjectURL(data.image)}
              alt="Uploaded"
              className="max-w-full h-auto"
            />
          </div>

          {/* Right Section for Content */}
          <div className="w-3/5 p-4">
            <div className="">
              {/* <h3 className="text-lg font-semibold text-gray-800">
                Brochure Description
              </h3> */}
              <CKEditor
                editor={ClassicEditor}
                data={data.output}
                onChange={(event, editor) => {
                  const bodyData = editor.getData();
                  // setBody(bodyData);
                  // data.outline = bodyData;
                }}
              />
            </div>
          </div>
        </div>
      </>
    );
  };

  const BlogOutline = ({ data, onNext }) => {
    const [h1Title, setH1Title] = useState(data?.finalTitle);
    const [body, setBody] = useState(data?.outline);

    const handleThirdStepNext = () => {
      onNext({
        h1Title: h1Title,
        body: body,
      });
    };

    return (
      <div className="">
        <div className="mb-2">
          <label className="text-gray-600 font-semibold block mb-2">
            H1 Title
          </label>
          <textarea
            value={h1Title}
            className="border border-gray-300 rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
            id="keywords"
            type="text"
            placeholder=""
            rows={2}
            onChange={(e) => {
              setH1Title(e.target.value);
              data.finalTitle = e.target.value;
            }}
          />
        </div>
        <div className="mb-2">
          <label className="text-gray-600 font-semibold block mb-2">
            Blog Body
          </label>
          <CKEditor
            editor={ClassicEditor}
            data={body}
            onChange={(event, editor) => {
              const bodyData = editor.getData();
              setBody(bodyData);
              data.outline = bodyData;
            }}
          />
        </div>

        <div className="flex justify-between items-center mt-8">
          <button
            className="px-4 py-2 rounded-md border border-indigo-500 text-indigo-500 text-sm flex items-center"
            onClick={() => setActiveTab("title")}
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back
          </button>
          <button
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
            onClick={handleThirdStepNext}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const GenerateContent = ({ data }) => (
    <div className="space-y-4">
      <div className="mb-2">
        <h1
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.h1Title) }}
        ></h1>
      </div>
      <div className="mb-2">
        <div
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.body) }}
        />
      </div>
      <div className="flex justify-between items-start mt-8">
        <button
          className="px-4 py-2 rounded-md border border-indigo-500 text-indigo-500 text-sm flex items-center"
          onClick={() => setActiveTab("outline")}
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back
        </button>
      </div>
    </div>
  );

  const TabWithNumber = ({ number, label, onClick, isActive }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 py-2 px-4 focus:outline-none ${
        isActive
          ? "text-indigo-600 font-semibold border-b-2 border-indigo-600"
          : "text-gray-600 font-semibold hover:text-indigo-500"
      }`}
    >
      <div className="rounded-full bg-gray-300 h-6 w-6 flex items-center justify-center">
        <span className="text-sm font-bold">{number}</span>
      </div>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-baseline md:items-center  space-x-4 mb-8">
            <TabWithNumber
              number={1}
              label="Brochure title & Image"
              // onClick={() => handleTabClick("purpose")}
              isActive={activeTab === "purpose"}
            />
            <TabWithNumber
              number={2}
              label="Generated Brochure"
              // onClick={() => handleTabClick("title")}
              isActive={activeTab === "title"}
            />
            {/* <TabWithNumber
              number={3}
              label="Blog Outline"
              // onClick={() => handleTabClick("outline")}
              isActive={activeTab === "outline"}
            />
            <TabWithNumber
              number={4}
              label="Generate Doc"
              // onClick={() => handleTabClick("generate")}
              isActive={activeTab === "generate"}
            /> */}
          </div>
          {activeTab === "purpose" && (
            <PurposeContent data={formData} onNext={handlePurposeNext} />
          )}
          {activeTab === "title" && (
            <BlogTitle data={formData} onNext={handleTitleNext} />
          )}
          {activeTab === "outline" && (
            <BlogOutline data={formData} onNext={handleOutlineNext} />
          )}
          {activeTab === "generate" && <GenerateContent data={formData} />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
