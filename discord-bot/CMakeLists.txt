cmake_minimum_required (VERSION 3.6)
project(example)

add_executable(waifu-bot bot.cpp)

add_subdirectory(sleepy-discord)
target_link_libraries(waifu-bot sleepy-discord)