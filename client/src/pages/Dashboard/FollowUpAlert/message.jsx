//  {/* Message Section Start */}

//               {/* <Form.Control
//                 type="text"
//                 name="alertId"
//                 value={input._id}
//                 hidden
//                 style={{ backgroundColor: "transparent" }}
//               />
//               <Form.Control
//                 type="text"
//                 name="author"
//                 hidden
//                 value={input.author?._id}
//                 style={{ backgroundColor: "transparent" }}
//               />
//               <Form.Control
//                 type="text"
//                 name="authorName"
//                 value={input.author?.name}
//                 hidden
//                 style={{ backgroundColor: "transparent" }}
//               />
//               <Form.Control
//                 type="text"
//                 name="authorIndex"
//                 value={input.author?.index}
//                 hidden
//                 style={{ backgroundColor: "transparent" }}
//               />
//               <Form.Control
//                 type="text"
//                 name="authorRole"
//                 value={input.author?.role}
//                 hidden
//                 style={{ backgroundColor: "transparent" }}
//               /> */}

//               <Row className="mt-2">
//                 <Form.Group className="mb-3" as={Col} controlId="formGridId">
//                   <div className="chat-container">
//                     {/* <div className="chat-header">💬 Live Chat</div> */}
//                     {/* // className={`chat-message ${msg.type}`} */}
//                     <div className="chat-messages">
//                       {/* {messages.map((msg, index) => (
//                         <div key={index} className={`chat-message ${msg.role}`}>
//                           <div className="chat-header-flex">
//                             <div>
//                               <strong style={{ fontSize: "15px" }}>
//                                 {msg.name}
//                               </strong>
//                             </div>
//                             <div>
//                               <small style={{ fontSize: "11px" }}>
//                                 {`${String(
//                                   new Date(msg.msgTime).getDate()
//                                 ).padStart(2, "0")}-${String(
//                                   new Date(msg.msgTime).getMonth() + 1
//                                 ).padStart(2, "0")}-${new Date(
//                                   msg.msgTime
//                                 ).getFullYear()}`}
//                                 , {new Date(msg.msgTime).toLocaleTimeString()}
//                               </small>
//                             </div>
//                           </div>

//                           <span style={{ fontSize: "14px" }}>
//                             {msg.message}
//                           </span>
//                         </div>
//                       ))} */}
//                       {/* <div ref={messagesEndRef} /> */}
//                     </div>
//                   </div>
//                 </Form.Group>

//                 <Form.Group controlId="communication" className="mt-2">
//                   <Form.Label>communication Message</Form.Label>
//                   <span
//                     style={{
//                       color: "red",
//                       fontSize: "20px",
//                       verticalAlign: "middle",
//                     }}
//                   >
//                     *
//                   </span>

//                   <Form.Control
//                     as="textarea"
//                     rows={1}
//                     name="communication"
//                     value={input.communication}
//                     onChange={handleCommunicationLogChange}
//                     onKeyDown={(e) => {
//                       if (e.key === "Enter" && !e.shiftKey) {
//                         e.preventDefault(); // prevent newline
//                         handleCommunicationSubmit(e); // manually trigger on Enter
//                       }
//                     }}
//                     style={{
//                       height: "80px", // fixed height
//                       overflowY: "auto", // show scroll when content overflows
//                       resize: "none", // prevent manual resize
//                       padding: "10px", // optional: padding for comfort
//                       fontSize: "14px", // optional: set font size
//                     }}
//                   />
//                 </Form.Group>
//               </Row>
//               <Row className="mt-2">
//                 <div class="d-grid gap-2 d-md-flex justify-content-md-end">
//                   <button class="btn btn-sm btn-primary me-md-2" type="submit">
//                     {" "}
//                     <i className="fa fa-edit"></i> Chat
//                   </button>
//                 </div>
//               </Row>