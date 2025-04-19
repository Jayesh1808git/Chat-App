
const MessageSkeleton = () => {
    // Create an array of 6 items for skeleton messages
    const skeletonMessages = Array(6).fill(null);
  
    return (
      <div className="bg-white flex-1 overflow-y-auto p-4 space-y-4">
        {skeletonMessages.map((_, idx) => (
          <div key={idx} className={`chat ${idx % 2 === 0 ? "chat-start" : "chat-end"}`}>
            
            <div className="chat-header mb-1 bg-white">
              <div className="skeleton h-4 w-16 bg-white"  />
            </div>
  
            <div className="chat-bubble bg-transparent p-0 bg-white">
              <div className="skeleton h-16 w-[200px] bg-white" />
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  export default MessageSkeleton;
  