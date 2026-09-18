const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const searchStr = `                            </div>
                        </div>
                            ))}
                        </div>`;

const newStr = `                            </div>
                        </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>`;

code = code.replace(searchStr, newStr);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed syntax error');
