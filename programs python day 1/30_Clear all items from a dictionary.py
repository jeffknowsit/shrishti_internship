z={
    'name' : "jeff",
    'age' : 25,
    'gender' : "male"
}
for i in list(z.keys()):
    z.pop(i)
print(len(z))