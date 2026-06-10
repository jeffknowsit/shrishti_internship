z=input("enter the string ")
y=z.split()
q=set(y)
for i in q:
    ct=0
    for j in y:
        if i==j:
            ct+=1
    print(i,"count is ",ct)

