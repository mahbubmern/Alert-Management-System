import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function AlertStepper({ assignedTo = [] }) {

    // Move Level_1 user to the start
  const sortedSteps = [...assignedTo].sort((a, b) => {
    if (a.role === "Level_1") return -1; // a comes first
    if (b.role === "Level_1") return 1;  // b comes first
    return 0; // keep original order
  });
  return (
    <div className="w-full overflow-x-auto py-5">
      <div className="flex items-center min-w-max px-6">
        {sortedSteps.map((step, index) => (
          <div key={index} className="relative flex flex-col items-center flex-1">

            {/* Line connecting this circle to the next */}
            {index < sortedSteps.length - 1 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.5 }}
                className="h-0.5 bg-green-500 absolute top-4 left-1/2"
                style={{ transform: "translateX(0%)" }}
              />
            )}

            {sortedSteps.length > 1 && <>
            
              {/* Green Circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.15 }}
              className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg border-4 border-green-600 z-10"
            >
              <Check className="w-5 h-5 text-white" />
            </motion.div>

            {/* Info Section */}
            <div className="text-center mt-3">
              <p className="text-gray-200 text-sm">{step.name}</p>
              <p className="text-gray-600 text-sm">{step.role}</p>
              <p className="text-green-700 text-xs mt-1">{step.acceptedAt}</p>
            </div>
            </> }

            
          </div>
        ))}
      </div>
    </div>
  );
}
