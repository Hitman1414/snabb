export default function Loading() {
    return (
        <div className="p-6 md:p-12 space-y-8 animate-pulse w-full max-w-[1600px] mx-auto">
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl w-1/4"></div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-xl w-1/3"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="h-[280px] bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex gap-2 mb-4">
                                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-xl w-20"></div>
                                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-xl w-16"></div>
                            </div>
                            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4 mb-4"></div>
                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-full mb-2"></div>
                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-5/6 mb-6"></div>
                            
                            <div className="flex gap-2">
                                <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-1/2"></div>
                                <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-1/2"></div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex gap-2 items-center">
                                <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16"></div>
                            </div>
                            <div className="h-6 w-12 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}